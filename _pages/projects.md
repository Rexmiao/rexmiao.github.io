---
layout: page
title: Projects
permalink: /projects/
description: Selected work in quantitative research, interactive tools, and scientific software.
nav: true
nav_order: 3
display_categories: [Quantitative Research, Research Software]
horizontal: false
---

Explore the research questions, methods, and available software behind each project.

[Quantitative research](#quantitative-research) · [Research software](#research-software)

{% assign portfolio_projects = site.projects | where: "portfolio", "runtian" %}

<div class="projects">
{% for category in page.display_categories %}
  <h2 class="category" id="{{ category | slugify }}">{{ category }}</h2>
  {% assign category_projects = portfolio_projects | where: "category", category | sort: "importance" %}
  <div class="grid">
    {% for project in category_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
{% endfor %}
</div>
