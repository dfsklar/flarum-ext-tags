import { extend } from 'flarum/extend';
import DiscussionListItem from 'flarum/components/DiscussionListItem';
import DiscussionPage from 'flarum/components/DiscussionPage';
import DiscussionHero from 'flarum/components/DiscussionHero';

import tagsLabel from 'flarum/tags/helpers/tagsLabel';
import sortTags from 'flarum/tags/utils/sortTags';

export default function() {
  // Add tag labels to each discussion in the discussion list.
  extend(DiscussionListItem.prototype, 'infoItems', function(items) {
    const tags = this.props.discussion.tags();

    if ($('.marketing-block').length > 0) {
      const destURL = app.siteSpecifics.fetchFormedURL();
      $('.nav-up').empty().append(
            ('<a href="' + destURL + '" class=returntoformed>&lt; Back to Community</a>'));
    }
    else if (tags && tags.length) {
      sortTags(tags).forEach(tag => {
        if (tag || tags.length === 1) {
          // DFSKLARD: We only want emission for the primary tag (repr the group as a whole)
          if (tag.data.attributes.isChild === true) {
            const linkelem = tagLabel(tag, { link: link }, {textToShow: "Up to Group Home"});
            // interestirng fields:
            // linkelem.attrs.className
            // attrs.href
            $('.nav-up').empty().append(
              $('<a href="' + linkelem.attrs.href + '">&lt; Back to group</a>')
            );
          }
        }
      });
    }
  });

  // Include a discussion's tags when fetching it.
  extend(DiscussionPage.prototype, 'params', function(params) {
    params.include.push('tags');
  });

  // Restyle a discussion's hero to use its first tag's color.
  extend(DiscussionHero.prototype, 'view', function(view) {
    const tags = sortTags(this.props.discussion.tags());

    if (tags && tags.length) {
      const color = tags[0].color();
      if (color) {
        view.children[0].attrs.style = {backgroundColor: color};
        view.attrs.className += ' DiscussionHero--colored';
      }
    }
  });

  // Add a list of a discussion's tags to the discussion hero, displayed
  // before the title. Put the title on its own line.
  extend(DiscussionHero.prototype, 'items', function(items) {
    const tags = this.props.discussion.tags();

    if (tags && tags.length) {
      items.add('tags', tagsLabel(tags, {link: true}), 5);
    }
  });
}
