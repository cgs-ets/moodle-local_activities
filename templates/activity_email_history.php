
<p>Dear [Name],</p>

<?php if ($includepermissions): ?>
    <p>The following activity requires your permission for [Student] to attend.</p>
<?php endif; ?>

<!-- Intro text -->
<table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
        <td>
            <?= $extratext ?>
        </td>
    </tr>
    <tr> 
        <td height="20"></td> 
    </tr>
</table>

<?php if ($includedetails): ?>
    <!-- Details -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td>
                <table border="0" cellspacing="0" cellpadding="20">
                    <tr>
                        <td style="border-radius: 3px;" bgcolor="#f0f4f6">
                            <div style="font-size: 15px;font-family: Helvetica, Arial, sans-serif;text-decoration: none;border-radius: 3px;display: block;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <?php 
                                        // Include the details template
                                        echo static::renderTemplate($CFG->dirroot . '/local/activities/templates/activity_details.php', (array) $activity);
                                    ?>
                                </table>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
<?php endif; ?>

<?php if ($includepermissions): ?>
    <!-- Action button -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr> 
            <td height="20"></td> 
        </tr>
        <tr>
            <td>
                <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="border-radius: 3px;" bgcolor="#005b94">
                            <a href="<?= $activity->permissionsurl ?>" target="_blank" style="font-size: 14px;font-weight: bold;font-family: Helvetica, Arial, sans-serif;color: #ffffff;text-decoration: none;border-radius: 3px;padding: 9px 13px;border: 1px solid #005b94;display: inline-block;">Click here to respond &rarr;</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
<?php endif; ?>

