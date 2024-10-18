<?php

namespace local_activities;

class local_activities_config {

	const WORKFLOW = array(

		// SENIOR ADMIN
	    'senior_admin' => array(
	    	'name' => 'Admin Approval',
	    	'invalidated_on_edit' => array (
	    		'timestart',
	    		'timeend',
	    	),
	    	'approvers' => array(
		        array(
		            'username' => 'admin',
		            'contacts' => null, // Default email in Moodle used.
		        ),
		        array(
		            'username' => 'admin',
		            'contacts' => array(
		            	'admin.email@gmail.com',
		            ),
                    'notifications' => array(
						'newcomment',
						'activityapproved',
						'activitychanged',
					),
		        ),
		    ),
		    'prerequisites' => null,
	    ),
		// SENIOR HOSS
	    'senior_hoss' => array(
	    	'name' => 'HoSS Approval',
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
					'notifications' => array('none'),
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
            'name' => 'RA Approval',
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
        ),
		// PRIMARY ADMIN
	    'primary_admin' => array(
	    	'name' => 'Admin Approval',
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
	    	'name' => 'HoPS Approval',
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
		    'prerequisites' => array(
		    	'primary_admin',
		    ),
			'canskip' => true,
	    ),


        // WHOLE ADMIN
	    'whole_admin' => array(
	    	'name' => 'Admin Approval',
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
	    ),
		// WHOLE FINAL
	    'whole_final' => array(
	    	'name' => 'Final Approval',
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
		    'prerequisites' => array(
		    	'whole_admin',
		    ),
			'canskip' => true,
	    ),

	);
	
}
