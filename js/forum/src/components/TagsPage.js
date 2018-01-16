import Component from 'flarum/Component';
import IndexPage from 'flarum/components/IndexPage';
import listItems from 'flarum/helpers/listItems';
import humanTime from 'flarum/helpers/humanTime';
import icon from 'flarum/helpers/icon';

import tagLabel from 'flarum/tags/helpers/tagLabel';
import sortTags from 'flarum/tags/utils/sortTags';

export default class TagsPage extends Component {
  init() {
    this.tags = sortTags(app.store.all('tags').filter(tag => !tag.parent()));

    app.current = this;
    app.history.push('tags', icon('th-large'));
    app.drawer.hide();
    app.modal.close();
  }

  view() {
    const pinned = this.tags.filter(tag => tag.position() !== null);
    const cloud = this.tags.filter(tag => tag.position() === null);

    return (
      <div className="TagsPage">
        {IndexPage.prototype.hero()}
      </div>
    );
  }
}
