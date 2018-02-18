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



  return <span {...attrs}></span>;
}
