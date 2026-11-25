---
layout: page
permalink: /publications/
title: Publications
description: Journal articles, manuscripts, preprints, conference contributions, and research data.
nav: true
nav_order: 2
---

<div class="publications">

<h2>Peer-reviewed journal articles</h2>
{% bibliography --group_by none --query @*[category=journal]* %}

<h2>Manuscripts under review</h2>
{% bibliography --group_by none --query @*[category=underreview]* %}

<h2>Preprints</h2>
{% bibliography --group_by none --query @*[category=preprint]* %}

<h2>Conference and symposium contributions</h2>
{% bibliography --query @*[category=conference]* %}

<h2>Research data</h2>
{% bibliography --group_by none --query @*[category=dataset]* %}

</div>
