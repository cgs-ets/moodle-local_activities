
<tr><td width="120"><strong>Activity name: </strong></td><td><?= $activityname ?></td></tr>
<tr><td><strong>Location: </strong></td><td><?php if (!$isactivity): ?>(Incursion)<?php endif; ?><?= $location ?></td></tr>
<tr><td><strong>Start: </strong></td><td><?= $startreadabletime ?></td></tr>
<tr><td><strong>End: </strong></td><td><?= $endreadabletime ?></td></tr>
<tr><td><strong>Details: </strong></td><td><?= $description ?></td></tr>
<?php if (!$isactivity): ?>
<tr><td><strong>Transport: </strong></td><td><?= $transport ?></td></tr>
<tr><td><strong>Cost: </strong></td><td><?= $cost ?></td></tr>
<?php endif; ?>
<tr><td><strong>Staff in charge: </strong></td><td><?= $staffinchargedata->fn ?> <?= $staffinchargedata->ln ?></td></tr>