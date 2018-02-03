import Page from 'flarum/components/Page';
import Button from 'flarum/components/Button';

import EditTagModal from 'flarum/tags/components/EditTagModal';
import TagSettingsModal from 'flarum/tags/components/TagSettingsModal';
import tagIcon from 'flarum/tags/helpers/tagIcon';
import sortTags from 'flarum/tags/utils/sortTags';

// DFSKLARD: Here we see how to launch the EditTagModel dialog that we might
// want to use for allowing a leader to do editing of a session (which is just a 2ndary tag).
function tagItem(tag) {
  return (
    <li data-id={tag.id()} style={{color: tag.color()}}>
      <div className="TagListItem-info">
        {tagIcon(tag)}
        <span className="TagListItem-name">{tag.name()}</span>
        {Button.component({
          className: 'Button Button--link',
          icon: 'pencil',
          onclick: () => app.modal.show(new EditTagModal({tag}))
        })}
      </div>
      {!tag.isChild() && tag.position() !== null ? (
        <ol className="TagListItem-children">
          {sortTags(app.store.all('tags'))
            .filter(child => child.parent() === tag)
            .map(tagItem)}
        </ol>
      ) : ''}
    </li>
  );
}

export default class TagsPage extends Page {
  view() {
    return (
      <div className="TagsPage">
        <div className="TagsPage-header">
          <div className="container">
          </div>
        </div>
      </div>
    );
  }

  config() {
    this.$('ol, ul')
      .sortable({connectWith: 'primary'})
      .on('sortupdate', (e, ui) => {
        // If we've moved a tag from 'primary' to 'secondary', then we'll update
        // its attributes in our local store so that when we redraw the change
        // will be made.
        if (ui.startparent.is('ol') && ui.endparent.is('ul')) {
          app.store.getById('tags', ui.item.data('id')).pushData({
            attributes: {
              position: null,
              isChild: false
            },
            relationships: {parent: null}
          });
        }

        // Construct an array of primary tag IDs and their children, in the same
        // order that they have been arranged in.
        const order = this.$('.TagList--primary > li')
          .map(function() {
            return {
              id: $(this).data('id'),
              children: $(this).find('li')
                .map(function() {
                  return $(this).data('id');
                }).get()
            };
          }).get();

        // Now that we have an accurate representation of the order which the
        // primary tags are in, we will update the tag attributes in our local
        // store to reflect this order.
        order.forEach((tag, i) => {
          const parent = app.store.getById('tags', tag.id);
          parent.pushData({
            attributes: {
              position: i,
              isChild: false
            },
            relationships: {parent: null}
          });

          tag.children.forEach((child, j) => {
            app.store.getById('tags', child).pushData({
              attributes: {
                position: j,
                isChild: true
              },
              relationships: {parent}
            });
          });
        });

        app.request({
          url: app.forum.attribute('apiUrl') + '/tags/order',
          method: 'POST',
          data: {order}
        });

        // A diff redraw won't work here, because sortable has mucked around
        // with the DOM which will confuse Mithril's diffing algorithm. Instead
        // we force a full reconstruction of the DOM.
        m.redraw.strategy('all');
        m.redraw();
      });
  }
}
