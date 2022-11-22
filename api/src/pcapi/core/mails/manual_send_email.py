#!/usr/bin/env python

from __future__ import print_function

import os
from pprint import pprint

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException


configuration = sib_api_v3_sdk.Configuration()
configuration.api_key["api-key"] = os.environ.get(
    "SENDINBLUE_API_KEY",
)

# Uncomment below lines to configure API key authorization using: partner-key
# configuration = sib_api_v3_sdk.Configuration()
# configuration.api_key['partner-key'] = 'YOUR_API_KEY'

# create an instance of the API class
api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
params = {
    "BOOKING_LINK": "https://passculture.app/offre/890584",
    "EVENT_DATETIME_ISO": "2022-08-21T14:00:00",
    "EVENT_DATE": "21 août 2022",
    "EVENT_HOUR": "14h00",
    "IS_DUO_EVENT": True,
    "OFFER_NAME": "Motocultor Festival 2022 - Pass Dimanche",
    "OFFER_TOKEN": "NDAUCV",
    "OFFER_WITHDRAWAL_DELAY": None,
    "OFFER_WITHDRAWAL_DETAILS": None,
    "OFFER_WITHDRAWAL_TYPE": None,
    "QR_CODE": "PASSCULTURE:v3;TOKEN:NDAUCV",
    "SUBCATEGORY": "FESTIVAL_MUSIQUE",
    "USER_FIRST_NAME": "Margot",
    "VENUE_ADDRESS": "Site de Kerboulard",
    "VENUE_CITY": "Saint-Nolff",
    "VENUE_NAME": "Motocultor Festival",
    "VENUE_POSTAL_CODE": "56250",
}

print(
    f"""
<div itemscope itemtype="http://schema.org/EventReservation">
    <meta itemprop="url" content="{params.get('BOOKING_LINK')}"/>
    <div itemprop="underName" itemscope itemtype="http://schema.org/Person">
        <meta itemprop="name" content="{params.get('USER_FIRST_NAME')}"/>
    </div>
    <meta itemprop="reservationNumber" content="{params.get('OFFER_TOKEN')}"/> <!-- this is not a standard of schema.org but need by https://www.google.com/webmasters/markup-tester/ -->
    <div itemprop="reservedTicket" itemscope itemtype="https://schema.org/Ticket">
        <meta itemprop="ticketNumber" content="{params.get('OFFER_TOKEN')}"/>
        <meta itemprop="ticketToken" content="{params.get('QR_CODE')}"/>
    </div>
    <meta itemprop="reservationStatus" content="http://schema.org/ReservationConfirmed"/>
    <div itemprop="reservationFor" itemscope itemtype="http://schema.org/Event">
        <meta itemprop="name" content="{params.get('OFFER_NAME')}"/>
        <meta itemprop="startDate" content="{params.get('EVENT_DATETIME_ISO')}"/>
        <div itemprop="location" itemscope itemtype="http://schema.org/Place">
            <meta itemprop="name" content="{params.get('VENUE_NAME')}"/>
            <div itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
                <meta itemprop="streetAddress" content="{params.get('VENUE_ADDRESS')}"/>
                <meta itemprop="addressLocality" content="{params.get('VENUE_CITY')}"/>
                <meta itemprop="postalCode" content="{params.get('VENUE_POSTAL_CODE')}"/>
                <meta itemprop="addressRegion" content="France"/>
                <meta itemprop="addressCountry" content="France"/>
            </div>
        </div>
    </div>
</div>
"""
)

send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
    # template_id=82, # testing
    template_id=665,  # prod
    to=[
        # {"email": "hugo.voisin@passculture.app", "name": "Hugo"},
        # {"email": "hpvoisin2@gmail.com", "name": "Bruno"},
        {"email": "bruno.ebstein@passculture.app", "name": "Bruno"},
        # {"email": "schema.whitelisting+sample@gmail.com", "name": "Google"}
        # {"email": "cedric.lesausse@passculture.app", "name": "Cédric"},
        # {"email": "thierry.gabin@passculture.app", "name": "Thierry"},
    ],
    sender={"email": "support@passculture.app", "name": "pass Culture"},
    reply_to={"email": "support@passculture.app", "name": "pass Culture"},
    # sender={"email": "support-pro@passculture.app", "name": "pass Culture"},
    # reply_to={"email": "support-pro@passculture.app", "name": "pass Culture"},
    params=params,
)

try:
    api_response = api_instance.send_transac_email(send_smtp_email)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
