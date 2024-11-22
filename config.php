<?php

namespace local_activities;

class local_activities_config {

	const WORKFLOW = array(

        // Senior RA
        'senior_ra' => array(
	    	'name' => 'SS RA Approval',
	    	'invalidated_on_edit' => array (
	    		'timestart',
	    		'timeend',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null, // Default email in Moodle used.
		        ),
		    ),
		    'prerequisites' => null,
	    ),
		// SENIOR ADMIN
	    'senior_admin' => array(
	    	'name' => 'SS Admin Approval',
	    	'invalidated_on_edit' => array (
	    		'timestart',
	    		'timeend',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null, // Default email in Moodle used.
		        ),
		        'teacher1' => array(
		            'username' => 'teacher1',
		            'contacts' => array(
		            	'admin.email@gmail.com',
		            ),
                    'notifications' => array(
						'newcomment',
						'activityapproved',
						'activitychanged',
					),
		        ),
                'teacher2' => array(
		            'username' => 'teacher2',
		            'contacts' => null,
                    'silent' => true,
		        ),
                'teacher3' => array(
		            'username' => 'teacher3',
		            'contacts' => null,
                    'silent' => true,
		        ),
                'teacher4' => array(
		            'username' => 'teacher4',
		            'contacts' => null,
                    //'silent' => true,
		        ),
		    ),
		    'prerequisites' => null,
	    ),
		// SENIOR HOSS
	    'senior_hoss' => array(
	    	'name' => 'SS HoSS Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
                'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
                    'notifications' => array('none'),
		        ),
		        'teacher1' => array(
		            'username' => 'teacher1',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => array(
		    	'senior_admin',
		    ),
			'canskip' => true,
			'selectable' => true, // The previous approver can select one of these approvers to notify.
	    ),





        // PRIMARY RA
        'primary_ra' => array(
            'name' => 'PS RA Approval',
            'invalidated_on_edit' => array (
                'location',
                'timestart',
                'timeend',
                'riskassessment',
            ),
            'approvers' => array(
                'admin' => array(
                    'username' => 'admin',
                    'contacts' => null,
                ),
            ),
            'prerequisites' => null,
        ),
		// PRIMARY ADMIN
	    'primary_admin' => array(
	    	'name' => 'PS Admin Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
		        array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => null,
		    //'prerequisites' => array(
		    //	'primary_ra',
		    //),
	    ),
		// PRIMARY HOPS
	    'primary_hops' => array(
	    	'name' => 'PS HoPS Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => array(
		    	'primary_admin',
		    ),
			'canskip' => true,
	    ),





        // WHOLE RA
	    'whole_ra' => array(
	    	'name' => 'WS Admin Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => null,
	    ),

        // WHOLE ADMIN
	    'whole_admin' => array(
	    	'name' => 'WS Admin Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
                'teacher4' => array(
		            'username' => 'teacher4',
		            'contacts' => null,
                    'silent' => true,
		        ),
		    ),
		    'prerequisites' => null,
	    ),

		// WHOLE FINAL
	    'whole_final' => array(
	    	'name' => 'WS Final Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => array(
		    	'whole_admin',
		    ),
			'canskip' => true,
	    ),




        // CAMPUSMNG
		'commercial_ra' => array(
	    	'name' => 'RA Approval',
	    	'invalidated_on_edit' => array(),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => null
	    ),
	    'commercial_admin' => array(
	    	'name' => 'Operations Approval',
	    	'invalidated_on_edit' => array(
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
		        'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
            ),
		    'prerequisites' => null,
	    ),
	    'commercial_final' => array(
	    	'name' => 'Final Approval',
	    	'invalidated_on_edit' => array (
	    		'location',
	    		'timestart',
	    		'timeend',
	    		'riskassessment',
	    	),
	    	'approvers' => array(
	    		'admin' => array(
		            'username' => 'admin',
		            'contacts' => null,
		        ),
		    ),
		    'prerequisites' => array(
		    	'whole_admin',
		    ),
	    ),









	);
	
}
