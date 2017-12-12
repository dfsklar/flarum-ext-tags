import extract from 'flarum/utils/extract';
import tagLabel from 'flarum/tags/helpers/tagLabel';
import sortTags from 'flarum/tags/utils/sortTags';

export default function tagsLabel(tags, attrs = {}) {
  const children = [];
  const link = extract(attrs, 'link');

  attrs.className = 'TagsLabel ' + (attrs.className || '');

  if (tags) {
    sortTags(tags).forEach(tag => {
      if (tag || tags.length === 1) {
        // DFSKLARD: We only want emission for the primary tag (repr the group as a whole)
        if (tag.data.attributes.isChild === false)
          children.push(tagLabel(tag, { link: link }, {textToShow: "Up to Group Home"}));
      }
    });
  } else {
    children.push(tagLabel());
  }

  return <span {...attrs}>{children}</span>;
}
