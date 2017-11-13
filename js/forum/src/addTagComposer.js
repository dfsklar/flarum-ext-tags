import { extend, override } from 'flarum/extend';
import IndexPage from 'flarum/components/IndexPage';
import DiscussionComposer from 'flarum/components/DiscussionComposer';

import TagDiscussionModal from 'flarum/tags/components/TagDiscussionModal';
import tagsLabel from 'flarum/tags/helpers/tagsLabel';

export default function() {
  extend(IndexPage.prototype, 'composeNewDiscussion', function(promise) {
    const tag = app.store.getBy('tags', 'slug', this.params().tags);

    if (tag) {
      const parent = tag.parent();
      const tags = parent ? [parent, tag] : [tag];
      promise.then(component => component.tags = tags);
    }
  });

  // Add tag-selection abilities to the discussion composer.
  DiscussionComposer.prototype.tags = [];
  DiscussionComposer.prototype.chooseTags = function() {
    app.modal.show(
      new TagDiscussionModal({
        selectedTags: this.tags.slice(0),
        onsubmit: tags => {
          this.tags = tags;
          this.$('textarea').focus();
        }
      })
    );
  };

  // DFSKLARD stripping some of this out.
  // We only want to show the session name, which is the secondary tag.
  // Add a tag-selection menu to the discussion composer's header, after the
  // title.
  // Originally, the outer element was an A with this onclick:
  //     onclick={this.chooseTags.bind(this)}
  extend(DiscussionComposer.prototype, 'headerItems', function(items) {
    items.add('tags', (
      <div className="DiscussionComposer-changeTags">
        {this.tags.length
          ? tagsLabel(this.tags.slice(1))
          : <span className="TagLabel untagged">{app.translator.trans('flarum-tags.forum.composer_discussion.choose_tags_link')}</span>}
      </div>
    ), 10);
  });

  override(DiscussionComposer.prototype, 'onsubmit', function(original) {
    const chosenTags = this.tags;
    const chosenPrimaryTags = chosenTags.filter(tag => tag.position() !== null && !tag.isChild());
    const chosenSecondaryTags = chosenTags.filter(tag => tag.position() === null);
    if (!chosenTags.length
      || (chosenPrimaryTags.length < app.forum.attribute('minPrimaryTags'))
      || (chosenSecondaryTags.length < app.forum.attribute('minSecondaryTags'))) {
      app.modal.show(
        new TagDiscussionModal({
          selectedTags: chosenTags,
          onsubmit: tags => {
            this.tags = tags;
            original();
          }
        })
      );
    } else {
      original();
    }
  });

  // Add the selected tags as data to submit to the server.
  extend(DiscussionComposer.prototype, 'data', function(data) {
    data.relationships = data.relationships || {};
    data.relationships.tags = this.tags;
  });
}
