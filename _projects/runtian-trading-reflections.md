---
layout: page
title: Trading Reflections
permalink: /projects/trading-reflections/
description: Notes on my own trades, covering decisions, execution, and risk management.
category: Trading
importance: 1
portfolio: runtian
status: Journal
latest_entries_from: trading_reflections
---

I use this journal to reflect on what I saw before a trade, how I planned and managed risk, what happened during execution, and what I would do differently next time.

## Entries

{% assign reflections = site.trading_reflections | where: "published", true | where_exp: "entry", "entry.date <= site.time" | sort: "date" | reverse %}

{% if reflections.size > 0 %}

<ol class="list-unstyled">
  {% for entry in reflections %}
    <li class="mb-4">
      <p class="mb-1"><small><time datetime="{{ entry.date | date_to_xmlschema }}">{{ entry.date | date: '%b %d, %Y' }}</time></small></p>
      <h3 class="h5 mb-1"><a href="{{ entry.url | relative_url }}">{{ entry.title | escape }}</a></h3>
      {% if entry.description %}<p class="mb-0">{{ entry.description | escape }}</p>{% endif %}
    </li>
  {% endfor %}
</ol>
{% else %}
No entries yet.
{% endif %}

[Back to Trading projects]({{ '/projects/' | relative_url }}#trading)
