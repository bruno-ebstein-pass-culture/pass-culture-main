from operator import attrgetter

from flask import flash
from flask import redirect
from flask import render_template
from flask import url_for
from flask_login import current_user
from flask_sqlalchemy import BaseQuery
import sqlalchemy as sa

import pcapi.core.history.api as history_api
import pcapi.core.history.models as history_models
import pcapi.core.permissions.models as perm_models
from pcapi.core.users.api import suspend_account
import pcapi.core.users.constants as users_constants
import pcapi.core.users.models as users_models

from . import utils
from .forms import fraud as forms


fraud_blueprint = utils.child_backoffice_blueprint(
    "fraud",
    __name__,
    url_prefix="/fraud",
    permission=perm_models.Permissions.FRAUD_ACTIONS,
)


def render_domain_names_list(form: forms.BlacklistDomainNameForm | None = None) -> utils.BackofficeResponse:
    if not form:
        form = forms.PrepareBlacklistDomainNameForm()

    history = (
        history_models.ActionHistory.query.filter_by(actionType=history_models.ActionType.BLACKLIST_DOMAIN_NAME)
        .order_by(history_models.ActionHistory.actionDate.desc())
        .limit(50)
        .options(
            sa.orm.joinedload(history_models.ActionHistory.authorUser).load_only(
                users_models.User.id, users_models.User.firstName, users_models.User.lastName, users_models.User.email
            )
        )
    )

    return render_template("fraud/domain_names.html", history=history, form=form)


@fraud_blueprint.route("", methods=["GET"])
def list_blacklisted_domain_names() -> utils.BackofficeResponse:
    return render_domain_names_list()


def _filter_non_pro_by_domain_name_query(domain_name: str) -> BaseQuery:
    return users_models.User.query.filter(
        sa.not_(users_models.User.isActive.is_(False)),
        sa.not_(users_models.User.has_pro_role),
        sa.not_(users_models.User.has_non_attached_pro_role),
        users_models.User.email.like(f"%@{domain_name.lower()}"),
    )


def _list_non_pro_suspensions(domain_name: str) -> list[str]:
    query = _filter_non_pro_by_domain_name_query(domain_name).options(
        sa.orm.load_only(users_models.User.id, users_models.User.email)
    )

    return sorted(query, key=attrgetter("email"))


def _list_untouched_pro_accounts(domain_name: str) -> list[str]:
    query = users_models.User.query.filter(
        sa.or_(  # type: ignore
            users_models.User.has_pro_role,
            users_models.User.has_non_attached_pro_role,
        ),
        users_models.User.email.like(f"%@{domain_name.lower()}"),
    ).options(sa.orm.load_only(users_models.User.id, users_models.User.email))

    return sorted(query, key=attrgetter("email"))


@fraud_blueprint.route("/blacklist-domain-name", methods=["GET"])
def prepare_blacklist_domain_name() -> utils.BackofficeResponse:
    form = forms.PrepareBlacklistDomainNameForm(utils.get_query_params())
    if not form.validate():
        flash(utils.build_form_error_msg(form), "warning")
        return render_domain_names_list(form)

    return render_template(
        "fraud/blacklist_domain_name_summary.html",
        domain_name=form.domain.data,
        targeted_non_pro_accounts=_list_non_pro_suspensions(form.domain.data),
        untouched_pro_accounts=_list_untouched_pro_accounts(form.domain.data),
    )


def _blacklist_domain_name(domain_name: str, actor: users_models.User) -> tuple[list[users_models.User], int]:
    """
    Suspend accounts by domain names. Only non-pro users are targeted,
    pro have different rules, restrictions, etc. and should be handled
    separately.
    """
    query = _filter_non_pro_by_domain_name_query(domain_name)

    users = []
    cancelled_bookings_count = 0

    for user in query:
        try:
            res = suspend_account(
                user=user, reason=users_constants.SuspensionReason.BLACKLISTED_DOMAIN_NAME, actor=actor
            )
        except Exception:  # pylint: disable=broad-exception-caught
            flash(
                "Une erreur est survenue lors de la suspension. Tous les comptes n'ont pas pu être traités.", "warning"
            )
            break

        users.append(user)
        cancelled_bookings_count += res["cancelled_bookings"]

    return users, cancelled_bookings_count


@fraud_blueprint.route("/blacklist-domain-name", methods=["POST"])
def blacklist_domain_name() -> utils.BackofficeResponse:
    form = forms.BlacklistDomainNameForm()
    if not form.validate():
        flash(utils.build_form_error_msg(form), "warning")
        return redirect(url_for(".list_blacklisted_domain_names"))

    users, cancelled_bookings_count = _blacklist_domain_name(form.domain.data, current_user)

    history_api.log_action(
        action_type=history_models.ActionType.BLACKLIST_DOMAIN_NAME,
        author=current_user,
        domain=form.domain.data,
        deactivated_users=sorted([(user.id, user.email) for user in users]),
        cancelled_bookings_count=cancelled_bookings_count,
    )

    deactivated_accounts_count = len(users)
    if deactivated_accounts_count > 1:
        deactivated_accounts_msg = (
            f"L'action a bien été prise en compte, {deactivated_accounts_count} comptes ont été suspendus."
        )
    elif deactivated_accounts_count == 1:
        deactivated_accounts_msg = "L'action a bien été prise en compte, un compte a été suspendu."
    else:
        deactivated_accounts_msg = "L'action a bien été prise en compte, aucun compte n'a été suspendu."

    if cancelled_bookings_count > 1:
        cancelled_bookings_msg = f"L'action a annulé {cancelled_bookings_count} réservations."
    elif cancelled_bookings_count == 1:
        cancelled_bookings_msg = "L'action a annulé une réservation."
    else:
        cancelled_bookings_msg = "L'action n'a annulé aucune réservation."

    flash(f"{deactivated_accounts_msg} {cancelled_bookings_msg}", "success")
    return redirect(url_for(".list_blacklisted_domain_names"))
