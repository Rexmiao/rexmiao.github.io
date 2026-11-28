---
layout: page
permalink: /publications/
title: Publications
description: Journal Articles, Manuscripts, Preprints, Conference Contributions, and Research Data
nav: true
nav_order: 2
---

<div class="publications">

<h2>Peer-Reviewed Journal Articles</h2>
{% bibliography --group_by none --query @*[category=journal]* %}

<h2>Manuscripts Under Review</h2>
{% bibliography --group_by none --query @*[category=underreview]* %}

<h2>Preprints</h2>
{% bibliography --group_by none --query @*[category=preprint]* %}

<h2>Conference and Symposium Contributions</h2>
{% bibliography --query @*[category=conference]* %}

<h2>Research Data</h2>
{% bibliography --group_by none --query @*[category=dataset]* %}

</div>
