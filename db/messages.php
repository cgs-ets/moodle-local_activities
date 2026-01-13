<?php

$messageproviders = array (
    'notifications' => array(
        'defaults' => array(
            'popup' => MESSAGE_PERMITTED, // Bell alerts by default.
            'airnotifier' => MESSAGE_PERMITTED, // Push notifications by default.
            'email' => MESSAGE_DISALLOWED, // Send emails via a separate API.
        ),
    ),
    'emails' => array(
        'defaults' => array(
            'email' => MESSAGE_PERMITTED, //  Does not use message api for sending emails, but makes use of the preference.
            'popup' => MESSAGE_DISALLOWED,
            'airnotifier' => MESSAGE_DISALLOWED,
        ),
    ),
);

