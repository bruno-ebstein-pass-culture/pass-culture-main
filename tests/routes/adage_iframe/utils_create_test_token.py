from datetime import datetime
from datetime import timedelta
from typing import ByteString

import jwt

from pcapi.core.users.models import ALGORITHM_RS_256

from tests.routes.adage_iframe import INVALID_RSA_PRIVATE_KEY_PATH
from tests.routes.adage_iframe import VALID_RSA_PRIVATE_KEY_PATH


def create_adage_jwt_fake_valid_token(
    email: str,
    uai_code: str,
    expiration_date: datetime = datetime.utcnow() + timedelta(days=1),
) -> ByteString:
    with open(VALID_RSA_PRIVATE_KEY_PATH, "rb") as reader:
        authenticated_informations = {
            "email": email,
            "UAICode": uai_code,
        }
        if expiration_date:
            authenticated_informations["exp"] = expiration_date

        return jwt.encode(
            authenticated_informations,
            key=reader.read(),
            algorithm=ALGORITHM_RS_256,
        )


def create_adage_jwt_fake_invalid_token(email: str, uai_code: str) -> ByteString:
    now = datetime.utcnow()
    with open(INVALID_RSA_PRIVATE_KEY_PATH, "rb") as reader:
        return jwt.encode(
            {
                "email": email,
                "UAICode": uai_code,
                "exp": now + timedelta(days=1),
            },
            key=reader.read(),
            algorithm=ALGORITHM_RS_256,
        )
