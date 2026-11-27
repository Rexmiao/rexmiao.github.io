---
layout: page
title: Projects
permalink: /projects/
description: Quantitative research, trading reflections, and scientific software.
nav: true
nav_order: 3
display_categories: [Quantitative Research, Trading, Research Software]
---

{% assign portfolio_projects = site.projects | where: "portfolio", "runtian" %}

<div class="projects">
  <nav class="project-navigation" aria-label="Jump to a project category">
    {% for category in page.display_categories %}
      <a href="#{{ category | slugify }}">{{ category }}</a>
    {% endfor %}
  </nav>
{% for category in page.display_categories %}
  {% assign category_id = category | slugify %}
  <section class="project-section" aria-labelledby="{{ category_id }}">
    <h2 class="project-category" id="{{ category_id }}">{{ category }}</h2>
    {% assign category_projects = portfolio_projects | where: "category", category | sort: "importance" %}
    <div class="project-grid">
      {% for project in category_projects %}
        {% include projects.liquid %}
      {% endfor %}
    </div>
  </section>
{% endfor %}
</div>
