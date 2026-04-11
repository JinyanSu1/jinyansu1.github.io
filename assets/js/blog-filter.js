document.addEventListener('DOMContentLoaded', function () {
  var tagGroups = document.querySelectorAll('.blog-tags');

  tagGroups.forEach(function (group) {
    var section = group.getAttribute('data-section');
    var pills = group.querySelectorAll('.tag-pill');
    var cards = document.querySelector('.blog-posts[data-section="' + section + '"]').querySelectorAll('.blog-post-card');

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var tag = this.getAttribute('data-tag');

        pills.forEach(function (p) { p.classList.remove('active'); });
        this.classList.add('active');

        cards.forEach(function (card) {
          var cardTags = card.getAttribute('data-tags').split(',');
          if (tag === 'all' || cardTags.indexOf(tag) !== -1) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  });
});
