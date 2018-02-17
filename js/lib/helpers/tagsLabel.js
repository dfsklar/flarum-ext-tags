import extract from 'flarum/utils/extract';
import tagLabel from 'flarum/tags/helpers/tagLabel';
import sortTags from 'flarum/tags/utils/sortTags';
import SiteSpecifics from 'flarum/SITESPECIFICS';

export default function tagsLabel(tags, attrs = {}) {
  const children = [];
  const link = extract(attrs, 'link');

  attrs.className = 'TagsLabel ' + (attrs.className || '');

  // DFSKLARD: I'm really abusing this "hook" for my own purposes.
  // I have no intent to return any real element here.
  // I am using this hook to place an anchor tag into the
  // .nav-up scaffolding.


  if ($('.marketing-block').length > 0) {
    const destURL = app.siteSpecifics.fetchFormedURL() + "/home?linkId=custom-content";
    $('.nav-up').empty().append(
            ('<a href="' + destURL + '" class=returntoformed>&lt; Back to Community</a>'));
  } 
  else if (tags) {
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

  return <span {...attrs}></span>;
}
