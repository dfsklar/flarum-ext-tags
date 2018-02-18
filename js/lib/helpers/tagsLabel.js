import extract from 'flarum/utils/extract';
import tagLabel from 'flarum/tags/helpers/tagLabel';
import sortTags from 'flarum/tags/utils/sortTags';
import SiteSpecifics from 'flarum/SITESPECIFICS';

export default function tagsLabel(tags, attrs = {}) {
  const children = [];
  const link = extract(attrs, 'link');

  attrs.className = 'TagsLabel ' + (attrs.className || '');


  return <span {...attrs}></span>;
}
