import { extend } from 'flarum/extend';
import IndexPage from 'flarum/components/IndexPage';
import Separator from 'flarum/components/Separator';
import LinkButton from 'flarum/components/LinkButton';

import TagLinkButton from 'flarum/tags/components/TagLinkButton';
import GroupsListHeader from 'flarum/tags/components/GroupsListHeader';
import TagsPage from 'flarum/tags/components/TagsPage';
import sortTags from 'flarum/tags/utils/sortTags';

export default function() {
  // Add a link to the tags page, as well as a list of all the tags,
  // to the index page's sidebar.
  extend(IndexPage.prototype, 'navItems', function(items) {

    /*
    items.add('tags', LinkButton.component({
      icon: 'th-large',
      children: app.translator.trans('flarum-tags.forum.index.tags_link'),
      href: app.route('tags')
    }), -10); */

    if (app.current instanceof TagsPage) return;

    // DFSKLARD: I want to show only the current tag's children (secondary tags).  That's all!

    items.add('separator', Separator.component(), -10);
    items.add('groups-list-header', GroupsListHeader.component({}), -10);

    const params = this.stickyParams();
    const tags = app.store.all('tags');
    const currentTag = this.currentTag();

    const addTag = tag => {
      let active = currentTag === tag;

      if (!active && currentTag) {
        active = currentTag.parent() === tag;
      }

      // ACTUALLY, I ONLY SHOW THE subtags OF THE active primary tag.
      if (tag.isChild() && (tag.parent() === currentTag)) {
        items.add('tag' + tag.id(), TagLinkButton.component({tag, params, active}), -10);
      }
    };

    sortTags(tags)
      .filter(tag => tag.position() !== null && (!tag.isChild() || (currentTag && (tag.parent() === currentTag || tag.parent() === currentTag.parent()))))
      .forEach(addTag);

    /*

    I SEE NO REASON FOR THIS.
    
    const more = tags
      .filter(tag => tag.position() === null)
      .sort((a, b) => b.discussionsCount() - a.discussionsCount());

    more.splice(0, 3).forEach(addTag);

    if (more.length) {
      items.add('moreTags', LinkButton.component({
        children: app.translator.trans('flarum-tags.forum.index.more_link'),
        href: app.route('tags')
      }), -10);
    }
    */



  });
}
