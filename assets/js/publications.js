document.addEventListener('DOMContentLoaded', function () {
  // Abstract expand/collapse
  var toggles = document.querySelectorAll('.pub-abstract-toggle');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = this.closest('.pub-card');
      var details = card.querySelector('.pub-details');
      var isExpanded = this.getAttribute('aria-expanded') === 'true';

      this.setAttribute('aria-expanded', !isExpanded);
      details.setAttribute('aria-hidden', isExpanded);
    });
  });

  // Tag filtering
  var pills = document.querySelectorAll('.pub-filter-pill');
  var cards = document.querySelectorAll('.pub-card');
  var yearSections = document.querySelectorAll('.pub-year-section');

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var tag = this.getAttribute('data-tag');

      pills.forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');

      cards.forEach(function (card) {
        var cardTags = (card.getAttribute('data-tags') || '').split(',');
        if (tag === 'all' || cardTags.indexOf(tag) !== -1) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });

      // Hide year sections that have no visible cards
      yearSections.forEach(function (section) {
        var visibleCards = section.querySelectorAll('.pub-card:not([style*="display: none"])');
        section.style.display = visibleCards.length > 0 ? '' : 'none';
      });
    });
  });
});
