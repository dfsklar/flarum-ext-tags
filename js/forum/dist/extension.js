'use strict';

System.register('flarum/tags/addTagComposer', ['flarum/extend', 'flarum/components/IndexPage', 'flarum/components/DiscussionComposer', 'flarum/tags/components/TagDiscussionModal', 'flarum/tags/helpers/tagsLabel'], function (_export, _context) {
  "use strict";

  var extend, override, IndexPage, DiscussionComposer, TagDiscussionModal, tagsLabel;

  _export('default', function () {
    extend(IndexPage.prototype, 'composeNewDiscussion', function (promise) {
      var tag = app.store.getBy('tags', 'slug', this.params().tags);

      if (tag) {
        var parent = tag.parent();
        var tags = parent ? [parent, tag] : [tag];
        promise.then(function (component) {
          return component.tags = tags;
        });
      }
    });

    // Add tag-selection abilities to the discussion composer.
    DiscussionComposer.prototype.tags = [];
    DiscussionComposer.prototype.chooseTags = function () {
      var _this = this;

      app.modal.show(new TagDiscussionModal({
        selectedTags: this.tags.slice(0),
        onsubmit: function onsubmit(tags) {
          _this.tags = tags;
          _this.$('textarea').focus();
        }
      }));
    };

    // DFSKLARD stripping some of this out.
    // We only want to show the session name, which is the secondary tag.
    // Add a tag-selection menu to the discussion composer's header, after the
    // title.
    // Originally, the outer element was an A with this onclick:
    //     onclick={this.chooseTags.bind(this)}
    extend(DiscussionComposer.prototype, 'headerItems', function (items) {
      items.add('tags', m(
        'div',
        { className: 'DiscussionComposer-changeTags' },
        this.tags.length ? tagsLabel(this.tags.slice(1)) : m(
          'span',
          { className: 'TagLabel untagged' },
          app.translator.trans('flarum-tags.forum.composer_discussion.choose_tags_link')
        )
      ), 10);
    });

    override(DiscussionComposer.prototype, 'onsubmit', function (original) {
      var _this2 = this;

      var chosenTags = this.tags;
      var chosenPrimaryTags = chosenTags.filter(function (tag) {
        return tag.position() !== null && !tag.isChild();
      });
      var chosenSecondaryTags = chosenTags.filter(function (tag) {
        return tag.position() === null;
      });
      if (!chosenTags.length || chosenPrimaryTags.length < app.forum.attribute('minPrimaryTags') || chosenSecondaryTags.length < app.forum.attribute('minSecondaryTags')) {
        app.modal.show(new TagDiscussionModal({
          selectedTags: chosenTags,
          onsubmit: function onsubmit(tags) {
            _this2.tags = tags;
            original();
          }
        }));
      } else {
        original();
      }
    });

    // Add the selected tags as data to submit to the server.
    extend(DiscussionComposer.prototype, 'data', function (data) {
      data.relationships = data.relationships || {};
      data.relationships.tags = this.tags;
    });
  });

  return {
    setters: [function (_flarumExtend) {
      extend = _flarumExtend.extend;
      override = _flarumExtend.override;
    }, function (_flarumComponentsIndexPage) {
      IndexPage = _flarumComponentsIndexPage.default;
    }, function (_flarumComponentsDiscussionComposer) {
      DiscussionComposer = _flarumComponentsDiscussionComposer.default;
    }, function (_flarumTagsComponentsTagDiscussionModal) {
      TagDiscussionModal = _flarumTagsComponentsTagDiscussionModal.default;
    }, function (_flarumTagsHelpersTagsLabel) {
      tagsLabel = _flarumTagsHelpersTagsLabel.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/addTagControl', ['flarum/extend', 'flarum/utils/DiscussionControls', 'flarum/components/Button', 'flarum/tags/components/TagDiscussionModal'], function (_export, _context) {
  "use strict";

  var extend, DiscussionControls, Button, TagDiscussionModal;

  _export('default', function () {
    // Add a control allowing the discussion to be moved to another category.
    extend(DiscussionControls, 'moderationControls', function (items, discussion) {
      if (discussion.canTag()) {
        items.add('tags', Button.component({
          children: app.translator.trans('flarum-tags.forum.discussion_controls.edit_tags_button'),
          icon: 'tag',
          onclick: function onclick() {
            return app.modal.show(new TagDiscussionModal({ discussion: discussion }));
          }
        }));
      }
    });
  });

  return {
    setters: [function (_flarumExtend) {
      extend = _flarumExtend.extend;
    }, function (_flarumUtilsDiscussionControls) {
      DiscussionControls = _flarumUtilsDiscussionControls.default;
    }, function (_flarumComponentsButton) {
      Button = _flarumComponentsButton.default;
    }, function (_flarumTagsComponentsTagDiscussionModal) {
      TagDiscussionModal = _flarumTagsComponentsTagDiscussionModal.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/addTagFilter', ['flarum/extend', 'flarum/components/IndexPage', 'flarum/components/DiscussionList', 'flarum/tags/components/TagHero'], function (_export, _context) {
  "use strict";

  var extend, override, IndexPage, DiscussionList, TagHero;

  _export('default', function () {
    IndexPage.prototype.currentTag = function () {
      var slug = this.params().tags;
      if (slug) {
        var current_tag = app.store.getBy('tags', 'slug', slug);
        if (!current_tag.data.attributes.isChild) {
          // SO: we have a situation where we want to reroute to the "latest-added"
          // subchild of this tag.
          // How to find subtags?
          var children = app.store.all('tags').filter(function (child) {
            return child.parent() === current_tag;
          });
          // 
          if (children) {
            if (children.length > 0) {
              var latest_child = children[children.length - 1];
              current_tag = latest_child;
            }
          }
        }
        return current_tag;
      }
    };

    // If currently viewing a tag, insert a tag hero at the top of the view.
    override(IndexPage.prototype, 'hero', function (original) {
      var tag = this.currentTag();

      if (tag) return TagHero.component({
        tag: tag,
        indexPageOwner: this,
        params: this.stickyParams()
      });

      return original();
    });

    extend(IndexPage.prototype, 'view', function (vdom) {
      var tag = this.currentTag();

      if (tag) {
        vdom.attrs.className += ' IndexPage--tag' + tag.id();
      }
    });

    // If currently viewing a tag, restyle the 'new discussion' button to use
    // the tag's color.
    extend(IndexPage.prototype, 'sidebarItems', function (items) {
      var tag = this.currentTag();

      if (tag) {
        var color = tag.color();

        if (color) {
          items.get('newDiscussion').props.style = { backgroundColor: color };
        }
      }
    });

    // Add a parameter for the IndexPage to pass on to the DiscussionList that
    // will let us filter discussions by tag.
    extend(IndexPage.prototype, 'params', function (params) {
      params.tags = m.route.param('tags');
    });

    // Translate that parameter into a gambit appended to the search query.
    extend(DiscussionList.prototype, 'requestParams', function (params) {
      params.include.push('tags');

      if (this.props.params.tags) {
        params.filter.q = (params.filter.q || '') + ' tag:' + this.props.params.tags;
      }
    });
  });

  return {
    setters: [function (_flarumExtend) {
      extend = _flarumExtend.extend;
      override = _flarumExtend.override;
    }, function (_flarumComponentsIndexPage) {
      IndexPage = _flarumComponentsIndexPage.default;
    }, function (_flarumComponentsDiscussionList) {
      DiscussionList = _flarumComponentsDiscussionList.default;
    }, function (_flarumTagsComponentsTagHero) {
      TagHero = _flarumTagsComponentsTagHero.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/addTagLabels', ['flarum/extend', 'flarum/components/DiscussionListItem', 'flarum/components/DiscussionPage', 'flarum/components/DiscussionHero', 'flarum/tags/helpers/tagsLabel', 'flarum/tags/utils/sortTags'], function (_export, _context) {
  "use strict";

  var extend, DiscussionListItem, DiscussionPage, DiscussionHero, tagsLabel, sortTags;

  _export('default', function () {
    // Add tag labels to each discussion in the discussion list.
    extend(DiscussionListItem.prototype, 'infoItems', function (items) {
      var tags = this.props.discussion.tags();

      if (tags && tags.length) {
        items.add('tags', tagsLabel(tags), 10);
      }
    });

    // Include a discussion's tags when fetching it.
    extend(DiscussionPage.prototype, 'params', function (params) {
      params.include.push('tags');
    });

    // Restyle a discussion's hero to use its first tag's color.
    extend(DiscussionHero.prototype, 'view', function (view) {
      var tags = sortTags(this.props.discussion.tags());

      if (tags && tags.length) {
        var color = tags[0].color();
        if (color) {
          view.children[0].attrs.style = { backgroundColor: color };
          view.attrs.className += ' DiscussionHero--colored';
        }
      }
    });

    // Add a list of a discussion's tags to the discussion hero, displayed
    // before the title. Put the title on its own line.
    extend(DiscussionHero.prototype, 'items', function (items) {
      var tags = this.props.discussion.tags();

      if (tags && tags.length) {
        items.add('tags', tagsLabel(tags, { link: true }), 5);
      }
    });
  });

  return {
    setters: [function (_flarumExtend) {
      extend = _flarumExtend.extend;
    }, function (_flarumComponentsDiscussionListItem) {
      DiscussionListItem = _flarumComponentsDiscussionListItem.default;
    }, function (_flarumComponentsDiscussionPage) {
      DiscussionPage = _flarumComponentsDiscussionPage.default;
    }, function (_flarumComponentsDiscussionHero) {
      DiscussionHero = _flarumComponentsDiscussionHero.default;
    }, function (_flarumTagsHelpersTagsLabel) {
      tagsLabel = _flarumTagsHelpersTagsLabel.default;
    }, function (_flarumTagsUtilsSortTags) {
      sortTags = _flarumTagsUtilsSortTags.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/addTagList', ['flarum/extend', 'flarum/components/IndexPage', 'flarum/components/Separator', 'flarum/components/LinkButton', 'flarum/tags/components/TagLinkButton', 'flarum/tags/components/GroupsListHeader', 'flarum/tags/components/TagsPage', 'flarum/tags/utils/sortTags'], function (_export, _context) {
  "use strict";

  var extend, IndexPage, Separator, LinkButton, TagLinkButton, GroupsListHeader, TagsPage, sortTags;

  _export('default', function () {
    // Add a link to the tags page, as well as a list of all the tags,
    // to the index page's sidebar.
    extend(IndexPage.prototype, 'navItems', function (items) {

      /*
      items.add('tags', LinkButton.component({
        icon: 'th-large',
        children: app.translator.trans('flarum-tags.forum.index.tags_link'),
        href: app.route('tags')
      }), -10); */

      if (app.current instanceof TagsPage) return;

      // DFSKLARD: I want to show only the current PRIMARY tag's children (secondary tags).  That's all!

      items.add('separator', Separator.component(), -10);
      items.add('groups-list-header', GroupsListHeader.component({}), -10);

      var params = this.stickyParams();
      var tags = app.store.all('tags');
      var currentTag = this.currentTag();

      var currentPrimaryTag = currentTag ? currentTag.isChild() ? currentTag.parent() : currentTag : null;

      var addTag = function addTag(tag, indexSeq, fullArray) {
        var active = currentTag === tag;

        if (!active && currentTag) {
          active = currentTag.parent() === tag;
        }

        if (tag.isChild() && tag.parent() === currentPrimaryTag) {
          // CAREFUL: similar logic is found in TagHero.js !!!!
          items.add('tag' + tag.id(), TagLinkButton.component({
            label: 'Session ' + String(fullArray.length - indexSeq) + " of " + String(fullArray.length),
            idx: fullArray.length - indexSeq,
            tag: tag,
            params: params,
            active: active }), -10);
        }
      };

      // DFSKLARD: The listing of sessions.
      // DFSKLARD: my own attempts at a custom list of secondary tags to provide a list of sessions.
      // I ONLY SHOW THE subtags OF THE active primary tag.
      var filtered_tags = tags.filter(function (tag) {
        return tag.position() !== null && tag.isChild() && tag.parent() === currentPrimaryTag;
      });
      filtered_tags.reverse().forEach(addTag);

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
  });

  return {
    setters: [function (_flarumExtend) {
      extend = _flarumExtend.extend;
    }, function (_flarumComponentsIndexPage) {
      IndexPage = _flarumComponentsIndexPage.default;
    }, function (_flarumComponentsSeparator) {
      Separator = _flarumComponentsSeparator.default;
    }, function (_flarumComponentsLinkButton) {
      LinkButton = _flarumComponentsLinkButton.default;
    }, function (_flarumTagsComponentsTagLinkButton) {
      TagLinkButton = _flarumTagsComponentsTagLinkButton.default;
    }, function (_flarumTagsComponentsGroupsListHeader) {
      GroupsListHeader = _flarumTagsComponentsGroupsListHeader.default;
    }, function (_flarumTagsComponentsTagsPage) {
      TagsPage = _flarumTagsComponentsTagsPage.default;
    }, function (_flarumTagsUtilsSortTags) {
      sortTags = _flarumTagsUtilsSortTags.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/components/DiscussionTaggedPost', ['flarum/components/EventPost', 'flarum/tags/helpers/tagsLabel'], function (_export, _context) {
  "use strict";

  var EventPost, tagsLabel, DiscussionTaggedPost;
  return {
    setters: [function (_flarumComponentsEventPost) {
      EventPost = _flarumComponentsEventPost.default;
    }, function (_flarumTagsHelpersTagsLabel) {
      tagsLabel = _flarumTagsHelpersTagsLabel.default;
    }],
    execute: function () {
      DiscussionTaggedPost = function (_EventPost) {
        babelHelpers.inherits(DiscussionTaggedPost, _EventPost);

        function DiscussionTaggedPost() {
          babelHelpers.classCallCheck(this, DiscussionTaggedPost);
          return babelHelpers.possibleConstructorReturn(this, (DiscussionTaggedPost.__proto__ || Object.getPrototypeOf(DiscussionTaggedPost)).apply(this, arguments));
        }

        babelHelpers.createClass(DiscussionTaggedPost, [{
          key: 'icon',
          value: function icon() {
            return 'tag';
          }
        }, {
          key: 'descriptionKey',
          value: function descriptionKey() {
            if (this.props.tagsAdded.length) {
              if (this.props.tagsRemoved.length) {
                return 'flarum-tags.forum.post_stream.added_and_removed_tags_text';
              }

              return 'flarum-tags.forum.post_stream.added_tags_text';
            }

            return 'flarum-tags.forum.post_stream.removed_tags_text';
          }
        }, {
          key: 'descriptionData',
          value: function descriptionData() {
            var data = {};

            if (this.props.tagsAdded.length) {
              data.tagsAdded = app.translator.transChoice('flarum-tags.forum.post_stream.tags_text', this.props.tagsAdded.length, {
                tags: tagsLabel(this.props.tagsAdded, { link: true }),
                count: this.props.tagsAdded.length
              });
            }

            if (this.props.tagsRemoved.length) {
              data.tagsRemoved = app.translator.transChoice('flarum-tags.forum.post_stream.tags_text', this.props.tagsRemoved.length, {
                tags: tagsLabel(this.props.tagsRemoved, { link: true }),
                count: this.props.tagsRemoved.length
              });
            }

            return data;
          }
        }], [{
          key: 'initProps',
          value: function initProps(props) {
            babelHelpers.get(DiscussionTaggedPost.__proto__ || Object.getPrototypeOf(DiscussionTaggedPost), 'initProps', this).call(this, props);

            var oldTags = props.post.content()[0];
            var newTags = props.post.content()[1];

            function diffTags(tags1, tags2) {
              return tags1.filter(function (tag) {
                return tags2.indexOf(tag) === -1;
              }).map(function (id) {
                return app.store.getById('tags', id);
              });
            }

            props.tagsAdded = diffTags(newTags, oldTags);
            props.tagsRemoved = diffTags(oldTags, newTags);
          }
        }]);
        return DiscussionTaggedPost;
      }(EventPost);

      _export('default', DiscussionTaggedPost);
    }
  };
});;
'use strict';

System.register('flarum/tags/components/EditTagModal', ['flarum/components/Modal', 'flarum/components/Button', 'flarum/utils/string', 'flarum/tags/helpers/tagLabel'], function (_export, _context) {
  "use strict";

  var Modal, Button, slug, tagLabel, EditTagModal;
  return {
    setters: [function (_flarumComponentsModal) {
      Modal = _flarumComponentsModal.default;
    }, function (_flarumComponentsButton) {
      Button = _flarumComponentsButton.default;
    }, function (_flarumUtilsString) {
      slug = _flarumUtilsString.slug;
    }, function (_flarumTagsHelpersTagLabel) {
      tagLabel = _flarumTagsHelpersTagLabel.default;
    }],
    execute: function () {
      EditTagModal = function (_Modal) {
        babelHelpers.inherits(EditTagModal, _Modal);

        function EditTagModal() {
          babelHelpers.classCallCheck(this, EditTagModal);
          return babelHelpers.possibleConstructorReturn(this, (EditTagModal.__proto__ || Object.getPrototypeOf(EditTagModal)).apply(this, arguments));
        }

        babelHelpers.createClass(EditTagModal, [{
          key: 'init',
          value: function init() {
            babelHelpers.get(EditTagModal.prototype.__proto__ || Object.getPrototypeOf(EditTagModal.prototype), 'init', this).call(this);

            this.tag = this.props.tag || app.store.createRecord('tags');

            this.name = m.prop(this.tag.name() || '');
            this.slug = m.prop(this.tag.slug() || '');
            this.description = m.prop(this.tag.description() || '');
            this.color = m.prop(this.tag.color() || '');
            this.isHidden = m.prop(this.tag.isHidden() || false);
          }
        }, {
          key: 'className',
          value: function className() {
            return 'EditTagModal Modal--small';
          }
        }, {
          key: 'title',
          value: function title() {
            return m(
              'b',
              null,
              'Edit Session Title/Description'
            );
          }
        }, {
          key: 'content',
          value: function content() {
            var _this2 = this;

            return m(
              'div',
              { className: 'Modal-body' },
              m(
                'div',
                { className: 'Form' },
                m(
                  'div',
                  { className: 'Form-group' },
                  m(
                    'label',
                    null,
                    'Short Title'
                  ),
                  m('input', { className: 'FormControl', placeholder: app.translator.trans('flarum-tags.admin.edit_tag.name_placeholder'), value: this.name(), oninput: function oninput(e) {
                      _this2.name(e.target.value);
                      // DFSKLARD: This was damaging the slug!  I want the slug to act as a persistent ID.
                    } })
                ),
                m(
                  'div',
                  { className: 'Form-group hidden' },
                  m(
                    'label',
                    null,
                    app.translator.trans('flarum-tags.admin.edit_tag.slug_label')
                  ),
                  m('input', { className: 'FormControl', value: this.slug(), oninput: m.withAttr('value', this.slug) })
                ),
                m(
                  'div',
                  { className: 'Form-group' },
                  m(
                    'label',
                    null,
                    'Description'
                  ),
                  m('textarea', { className: 'FormControl', value: this.description(), oninput: m.withAttr('value', this.description) })
                ),
                m(
                  'div',
                  { className: 'hidden' },
                  m(
                    'label',
                    null,
                    app.translator.trans('flarum-tags.admin.edit_tag.color_label')
                  ),
                  m('input', { className: 'FormControl', placeholder: '#aaaaaa', value: this.color(), oninput: m.withAttr('value', this.color) })
                ),
                m(
                  'div',
                  { className: 'hidden' },
                  m(
                    'div',
                    null,
                    m(
                      'label',
                      { className: 'checkbox' },
                      m('input', { type: 'checkbox', value: '1', checked: this.isHidden(), onchange: m.withAttr('checked', this.isHidden) }),
                      app.translator.trans('flarum-tags.admin.edit_tag.hide_label')
                    )
                  )
                ),
                m(
                  'div',
                  { className: 'Form-group' },
                  Button.component({
                    type: 'submit',
                    className: 'Button Button--primary EditTagModal-save',
                    loading: this.loading,
                    children: ['Submit']
                  }),
                  false && this.tag.exists ? m(
                    'button',
                    { type: 'button', className: 'Button EditTagModal-delete', onclick: this.delete.bind(this) },
                    app.translator.trans('flarum-tags.admin.edit_tag.delete_tag_button')
                  ) : ''
                )
              )
            );
          }
        }, {
          key: 'submitData',
          value: function submitData() {
            return {
              name: this.name(),
              slug: this.slug(),
              description: this.description(),
              color: this.color(),
              isHidden: this.isHidden()
            };
          }
        }, {
          key: 'onsubmit',
          value: function onsubmit(e) {
            var _this3 = this;

            e.preventDefault();

            this.loading = true;

            // DFSKLARD save tag changes
            this.tag.save(this.submitData()).then(function () {
              return _this3.hide();
            }, function (response) {
              _this3.loading = false;
              _this3.handleErrors(response);
            });
          }
        }, {
          key: 'delete',
          value: function _delete() {
            var _this4 = this;

            if (confirm(app.translator.trans('flarum-tags.admin.edit_tag.delete_tag_confirmation'))) {
              var children = app.store.all('tags').filter(function (tag) {
                return tag.parent() === _this4.tag;
              });

              this.tag.delete().then(function () {
                children.forEach(function (tag) {
                  return tag.pushData({
                    attributes: { isChild: false },
                    relationships: { parent: null }
                  });
                });
                m.redraw();
              });

              this.hide();
            }
          }
        }]);
        return EditTagModal;
      }(Modal);

      _export('default', EditTagModal);
    }
  };
});;
"use strict";

System.register("flarum/tags/components/GroupsListHeader", ["flarum/Component"], function (_export, _context) {
  "use strict";

  var Component, GroupsListHeader;
  return {
    setters: [function (_flarumComponent) {
      Component = _flarumComponent.default;
    }],
    execute: function () {
      GroupsListHeader = function (_Component) {
        babelHelpers.inherits(GroupsListHeader, _Component);

        function GroupsListHeader() {
          babelHelpers.classCallCheck(this, GroupsListHeader);
          return babelHelpers.possibleConstructorReturn(this, (GroupsListHeader.__proto__ || Object.getPrototypeOf(GroupsListHeader)).apply(this, arguments));
        }

        babelHelpers.createClass(GroupsListHeader, [{
          key: "view",
          value: function view() {
            return m(
              "div",
              { "class": "sessions-list-header" },
              "Sessions"
            );
          }
        }]);
        return GroupsListHeader;
      }(Component);

      _export("default", GroupsListHeader);
    }
  };
});;
'use strict';

System.register('flarum/tags/components/TagDiscussionModal', ['flarum/components/Modal', 'flarum/components/DiscussionPage', 'flarum/components/Button', 'flarum/helpers/highlight', 'flarum/utils/classList', 'flarum/utils/extractText', 'flarum/utils/KeyboardNavigatable', 'flarum/tags/helpers/tagLabel', 'flarum/tags/helpers/tagIcon', 'flarum/tags/utils/sortTags'], function (_export, _context) {
  "use strict";

  var Modal, DiscussionPage, Button, highlight, classList, extractText, KeyboardNavigatable, tagLabel, tagIcon, sortTags, TagDiscussionModal;
  return {
    setters: [function (_flarumComponentsModal) {
      Modal = _flarumComponentsModal.default;
    }, function (_flarumComponentsDiscussionPage) {
      DiscussionPage = _flarumComponentsDiscussionPage.default;
    }, function (_flarumComponentsButton) {
      Button = _flarumComponentsButton.default;
    }, function (_flarumHelpersHighlight) {
      highlight = _flarumHelpersHighlight.default;
    }, function (_flarumUtilsClassList) {
      classList = _flarumUtilsClassList.default;
    }, function (_flarumUtilsExtractText) {
      extractText = _flarumUtilsExtractText.default;
    }, function (_flarumUtilsKeyboardNavigatable) {
      KeyboardNavigatable = _flarumUtilsKeyboardNavigatable.default;
    }, function (_flarumTagsHelpersTagLabel) {
      tagLabel = _flarumTagsHelpersTagLabel.default;
    }, function (_flarumTagsHelpersTagIcon) {
      tagIcon = _flarumTagsHelpersTagIcon.default;
    }, function (_flarumTagsUtilsSortTags) {
      sortTags = _flarumTagsUtilsSortTags.default;
    }],
    execute: function () {
      TagDiscussionModal = function (_Modal) {
        babelHelpers.inherits(TagDiscussionModal, _Modal);

        function TagDiscussionModal() {
          babelHelpers.classCallCheck(this, TagDiscussionModal);
          return babelHelpers.possibleConstructorReturn(this, (TagDiscussionModal.__proto__ || Object.getPrototypeOf(TagDiscussionModal)).apply(this, arguments));
        }

        babelHelpers.createClass(TagDiscussionModal, [{
          key: 'init',
          value: function init() {
            var _this2 = this;

            babelHelpers.get(TagDiscussionModal.prototype.__proto__ || Object.getPrototypeOf(TagDiscussionModal.prototype), 'init', this).call(this);

            this.tags = app.store.all('tags');

            if (this.props.discussion) {
              this.tags = this.tags.filter(function (tag) {
                return tag.canAddToDiscussion() || _this2.props.discussion.tags().indexOf(tag) !== -1;
              });
            } else {
              this.tags = this.tags.filter(function (tag) {
                return tag.canStartDiscussion();
              });
            }

            this.tags = sortTags(this.tags);

            this.selected = [];
            this.filter = m.prop('');
            this.index = this.tags[0].id();
            this.focused = false;

            if (this.props.selectedTags) {
              this.props.selectedTags.map(this.addTag.bind(this));
            } else if (this.props.discussion) {
              this.props.discussion.tags().map(this.addTag.bind(this));
            }

            this.minPrimary = app.forum.attribute('minPrimaryTags');
            this.maxPrimary = app.forum.attribute('maxPrimaryTags');
            this.minSecondary = app.forum.attribute('minSecondaryTags');
            this.maxSecondary = app.forum.attribute('maxSecondaryTags');

            this.navigator = new KeyboardNavigatable();
            this.navigator.onUp(function () {
              return _this2.setIndex(_this2.getCurrentNumericIndex() - 1, true);
            }).onDown(function () {
              return _this2.setIndex(_this2.getCurrentNumericIndex() + 1, true);
            }).onSelect(this.select.bind(this)).onRemove(function () {
              return _this2.selected.splice(_this2.selected.length - 1, 1);
            });
          }
        }, {
          key: 'primaryCount',
          value: function primaryCount() {
            return this.selected.filter(function (tag) {
              return tag.isPrimary();
            }).length;
          }
        }, {
          key: 'secondaryCount',
          value: function secondaryCount() {
            return this.selected.filter(function (tag) {
              return !tag.isPrimary();
            }).length;
          }
        }, {
          key: 'addTag',
          value: function addTag(tag) {
            if (!tag.canStartDiscussion()) return;

            // If this tag has a parent, we'll also need to add the parent tag to the
            // selected list if it's not already in there.
            var parent = tag.parent();
            if (parent) {
              var index = this.selected.indexOf(parent);
              if (index === -1) {
                this.selected.push(parent);
              }
            }

            this.selected.push(tag);
          }
        }, {
          key: 'removeTag',
          value: function removeTag(tag) {
            var index = this.selected.indexOf(tag);
            if (index !== -1) {
              this.selected.splice(index, 1);

              // Look through the list of selected tags for any tags which have the tag
              // we just removed as their parent. We'll need to remove them too.
              this.selected.filter(function (selected) {
                return selected.parent() === tag;
              }).forEach(this.removeTag.bind(this));
            }
          }
        }, {
          key: 'className',
          value: function className() {
            return 'TagDiscussionModal';
          }
        }, {
          key: 'title',
          value: function title() {
            return this.props.discussion ? app.translator.trans('flarum-tags.forum.choose_tags.edit_title', { title: m(
                'em',
                null,
                this.props.discussion.title()
              ) }) : app.translator.trans('flarum-tags.forum.choose_tags.title');
          }
        }, {
          key: 'getInstruction',
          value: function getInstruction(primaryCount, secondaryCount) {
            if (primaryCount < this.minPrimary) {
              var remaining = this.minPrimary - primaryCount;
              return app.translator.transChoice('flarum-tags.forum.choose_tags.choose_primary_placeholder', remaining, { count: remaining });
            } else if (secondaryCount < this.minSecondary) {
              var _remaining = this.minSecondary - secondaryCount;
              return app.translator.transChoice('flarum-tags.forum.choose_tags.choose_secondary_placeholder', _remaining, { count: _remaining });
            }

            return '';
          }
        }, {
          key: 'content',
          value: function content() {
            var _this3 = this;

            var tags = this.tags;
            var filter = this.filter().toLowerCase();
            var primaryCount = this.primaryCount();
            var secondaryCount = this.secondaryCount();

            // Filter out all child tags whose parents have not been selected. This
            // makes it impossible to select a child if its parent hasn't been selected.
            tags = tags.filter(function (tag) {
              var parent = tag.parent();
              return parent === false || _this3.selected.indexOf(parent) !== -1;
            });

            // If the number of selected primary/secondary tags is at the maximum, then
            // we'll filter out all other tags of that type.
            if (primaryCount >= this.maxPrimary) {
              tags = tags.filter(function (tag) {
                return !tag.isPrimary() || _this3.selected.indexOf(tag) !== -1;
              });
            }

            if (secondaryCount >= this.maxSecondary) {
              tags = tags.filter(function (tag) {
                return tag.isPrimary() || _this3.selected.indexOf(tag) !== -1;
              });
            }

            // If the user has entered text in the filter input, then filter by tags
            // whose name matches what they've entered.
            if (filter) {
              tags = tags.filter(function (tag) {
                return tag.name().substr(0, filter.length).toLowerCase() === filter;
              });
            }

            if (tags.indexOf(this.index) === -1) this.index = tags[0];

            return [m(
              'div',
              { className: 'Modal-body' },
              m(
                'div',
                { className: 'TagDiscussionModal-form' },
                m(
                  'div',
                  { className: 'TagDiscussionModal-form-input' },
                  m(
                    'div',
                    { className: 'TagsInput FormControl ' + (this.focused ? 'focus' : '') },
                    m(
                      'span',
                      { className: 'TagsInput-selected' },
                      this.selected.map(function (tag) {
                        return m(
                          'span',
                          { className: 'TagsInput-tag', onclick: function onclick() {
                              _this3.removeTag(tag);
                              _this3.onready();
                            } },
                          tagLabel(tag)
                        );
                      })
                    ),
                    m('input', { className: 'FormControl',
                      placeholder: extractText(this.getInstruction(primaryCount, secondaryCount)),
                      value: this.filter(),
                      oninput: m.withAttr('value', this.filter),
                      onkeydown: this.navigator.navigate.bind(this.navigator),
                      onfocus: function onfocus() {
                        return _this3.focused = true;
                      },
                      onblur: function onblur() {
                        return _this3.focused = false;
                      } })
                  )
                ),
                m(
                  'div',
                  { className: 'TagDiscussionModal-form-submit App-primaryControl' },
                  Button.component({
                    type: 'submit',
                    className: 'Button Button--primary',
                    disabled: primaryCount < this.minPrimary || secondaryCount < this.minSecondary,
                    icon: 'check',
                    children: app.translator.trans('flarum-tags.forum.choose_tags.submit_button')
                  })
                )
              )
            ), m(
              'div',
              { className: 'Modal-footer' },
              m(
                'ul',
                { className: 'TagDiscussionModal-list SelectTagList' },
                tags.filter(function (tag) {
                  return filter || !tag.parent() || _this3.selected.indexOf(tag.parent()) !== -1;
                }).map(function (tag) {
                  return m(
                    'li',
                    { 'data-index': tag.id(),
                      className: classList({
                        pinned: tag.position() !== null,
                        child: !!tag.parent(),
                        colored: !!tag.color(),
                        selected: _this3.selected.indexOf(tag) !== -1,
                        active: _this3.index === tag
                      }),
                      style: { color: tag.color() },
                      onmouseover: function onmouseover() {
                        return _this3.index = tag;
                      },
                      onclick: _this3.toggleTag.bind(_this3, tag)
                    },
                    tagIcon(tag),
                    m(
                      'span',
                      { className: 'SelectTagListItem-name' },
                      highlight(tag.name(), filter)
                    ),
                    tag.description() ? m(
                      'span',
                      { className: 'SelectTagListItem-description' },
                      tag.description()
                    ) : ''
                  );
                })
              )
            )];
          }
        }, {
          key: 'toggleTag',
          value: function toggleTag(tag) {
            var index = this.selected.indexOf(tag);

            if (index !== -1) {
              this.removeTag(tag);
            } else {
              this.addTag(tag);
            }

            if (this.filter()) {
              this.filter('');
              this.index = this.tags[0];
            }

            this.onready();
          }
        }, {
          key: 'select',
          value: function select(e) {
            // Ctrl + Enter submits the selection, just Enter completes the current entry
            if (e.metaKey || e.ctrlKey || this.selected.indexOf(this.index) !== -1) {
              if (this.selected.length) {
                this.$('form').submit();
              }
            } else {
              this.getItem(this.index)[0].dispatchEvent(new Event('click'));
            }
          }
        }, {
          key: 'selectableItems',
          value: function selectableItems() {
            return this.$('.TagDiscussionModal-list > li');
          }
        }, {
          key: 'getCurrentNumericIndex',
          value: function getCurrentNumericIndex() {
            return this.selectableItems().index(this.getItem(this.index));
          }
        }, {
          key: 'getItem',
          value: function getItem(index) {
            return this.selectableItems().filter('[data-index="' + index.id() + '"]');
          }
        }, {
          key: 'setIndex',
          value: function setIndex(index, scrollToItem) {
            var $items = this.selectableItems();
            var $dropdown = $items.parent();

            if (index < 0) {
              index = $items.length - 1;
            } else if (index >= $items.length) {
              index = 0;
            }

            var $item = $items.eq(index);

            this.index = app.store.getById('tags', $item.attr('data-index'));

            m.redraw();

            if (scrollToItem) {
              var dropdownScroll = $dropdown.scrollTop();
              var dropdownTop = $dropdown.offset().top;
              var dropdownBottom = dropdownTop + $dropdown.outerHeight();
              var itemTop = $item.offset().top;
              var itemBottom = itemTop + $item.outerHeight();

              var scrollTop = void 0;
              if (itemTop < dropdownTop) {
                scrollTop = dropdownScroll - dropdownTop + itemTop - parseInt($dropdown.css('padding-top'), 10);
              } else if (itemBottom > dropdownBottom) {
                scrollTop = dropdownScroll - dropdownBottom + itemBottom + parseInt($dropdown.css('padding-bottom'), 10);
              }

              if (typeof scrollTop !== 'undefined') {
                $dropdown.stop(true).animate({ scrollTop: scrollTop }, 100);
              }
            }
          }
        }, {
          key: 'onsubmit',
          value: function onsubmit(e) {
            e.preventDefault();

            var discussion = this.props.discussion;
            var tags = this.selected;

            if (discussion) {
              discussion.save({ relationships: { tags: tags } }).then(function () {
                if (app.current instanceof DiscussionPage) {
                  app.current.stream.update();
                }
                m.redraw();
              });
            }

            if (this.props.onsubmit) this.props.onsubmit(tags);

            app.modal.close();

            m.redraw.strategy('none');
          }
        }]);
        return TagDiscussionModal;
      }(Modal);

      _export('default', TagDiscussionModal);
    }
  };
});;
'use strict';

System.register('flarum/tags/components/TagHero', ['flarum/Component', 'flarum/helpers/icon', 'flarum/components/LoadingIndicator', 'flarum/components/SelectDropdown', 'flarum/components/Dropdown', 'flarum/components/UserRosterDropdown', 'flarum/utils/ItemList', 'flarum/tags/components/TagLinkButton', 'flarum/tags/components/EditTagModal', 'flarum/components/Button', 'flarum/components/LinkButton'], function (_export, _context) {
	"use strict";

	var Component, icon, LoadingIndicator, SelectDropdown, Dropdown, UserRosterDropdown, ItemList, TagLinkButton, EditTagModal, Button, LinkButton, TagHero;
	return {
		setters: [function (_flarumComponent) {
			Component = _flarumComponent.default;
		}, function (_flarumHelpersIcon) {
			icon = _flarumHelpersIcon.default;
		}, function (_flarumComponentsLoadingIndicator) {
			LoadingIndicator = _flarumComponentsLoadingIndicator.default;
		}, function (_flarumComponentsSelectDropdown) {
			SelectDropdown = _flarumComponentsSelectDropdown.default;
		}, function (_flarumComponentsDropdown) {
			Dropdown = _flarumComponentsDropdown.default;
		}, function (_flarumComponentsUserRosterDropdown) {
			UserRosterDropdown = _flarumComponentsUserRosterDropdown.default;
		}, function (_flarumUtilsItemList) {
			ItemList = _flarumUtilsItemList.default;
		}, function (_flarumTagsComponentsTagLinkButton) {
			TagLinkButton = _flarumTagsComponentsTagLinkButton.default;
		}, function (_flarumTagsComponentsEditTagModal) {
			EditTagModal = _flarumTagsComponentsEditTagModal.default;
		}, function (_flarumComponentsButton) {
			Button = _flarumComponentsButton.default;
		}, function (_flarumComponentsLinkButton) {
			LinkButton = _flarumComponentsLinkButton.default;
		}],
		execute: function () {
			TagHero = function (_Component) {
				babelHelpers.inherits(TagHero, _Component);

				function TagHero() {
					babelHelpers.classCallCheck(this, TagHero);
					return babelHelpers.possibleConstructorReturn(this, (TagHero.__proto__ || Object.getPrototypeOf(TagHero)).apply(this, arguments));
				}

				babelHelpers.createClass(TagHero, [{
					key: 'refreshGroupMembershipInfo',
					value: function refreshGroupMembershipInfo() {
						var _this2 = this;

						// So now you want to obtain the USER object for the currently logged-in user.
						// In that user object you'll find:
						//   data.relationships.groups.data which is an array.
						//     Each record in that array has a "id" object, string repr of a number.
						// The current user's ID is in:  app.data.session.userId
						this.loading = false;
						this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;
						this.isMemberOfGroup = this.loggedinUserMembershipList.some(function (group) {
							return group.id == _this2.matchingGroup.data.id;
						});
						m.redraw();
					}
				}, {
					key: 'recordGroupRoster',
					value: function recordGroupRoster(r) {
						this.groupMembershipRoster = r.data.relationships.users.data;
						m.redraw();
					}
				}, {
					key: 'init',
					value: function init() {
						// We want to force a reload of this user's complete info in case its group-membership list has changed.
						this.loading = true;
						app.store.find('users', app.session.user.id()).then(this.refreshGroupMembershipInfo.bind(this));

						this.tag = this.props.tag;
						this.params = this.props.params; // IndexPage's stickyParams

						this.indexPageOwner = this.props.indexPageOwner;

						this.color = this.tag.color();
						this.parent = app.store.getById('tags', this.tag.data.relationships.parent.data.id);

						// TRY TO OBTAIN INFO ABOUT THE *GROUP* THAT MATCHES THE PARENT TAG
						this.matchingGroup = app.store.getBy('groups', 'slug', this.parent.slug());
						this.isMemberOfGroup = false; // Meaning: we do not know yet, but a fresh reload is already taking place.

						app.store.find('groups', this.matchingGroup.data.id).then(this.recordGroupRoster.bind(this));

						// Am "I" the leader of this group?
						var groupLeaderUserID = this.tag.data.attributes.leaderUserId;
						this.yesIAmTheLeaderOfThisGroup = String(groupLeaderUserID) == String(app.session.user.data.id);
					}
				}, {
					key: '_join',
					value: function _join() {
						var _this3 = this;

						this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;
						this.loggedinUserMembershipList.push({ type: "groups", id: this.matchingGroup.data.id });
						app.session.user.save({ relationships: app.session.user.data.relationships }).then(function () {
							_this3.isMemberOfGroup = true;
							_this3.loading = false;
							_this3.indexPageOwner.assertMembership(true);
							console.log("good");
							m.redraw();
						}).catch(function () {
							_this3.loading = false;
							console.log("bad");
							m.redraw();
						});
					}
				}, {
					key: 'join',
					value: function join() {
						// So: let's try to effect the actual joining of a group from here.
						this.loading = true;
						app.store.find('users', app.session.user.id()).then(this._join.bind(this));
					}
				}, {
					key: '_unjoin',
					value: function _unjoin() {
						var _this4 = this;

						this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;
						var _find = function _find(element) {
							return element.type == 'groups' && element.id == this.matchingGroup.data.id;
						};

						var idxToDelete = this.loggedinUserMembershipList.findIndex(_find.bind(this));
						if (idxToDelete >= 0) {
							this.loggedinUserMembershipList.splice(idxToDelete, 1);
						}
						app.session.user.save({ relationships: app.session.user.data.relationships }).then(function () {
							_this4.isMemberOfGroup = false;
							_this4.loading = false;
							_this4.indexPageOwner.assertMembership(false);
							m.redraw();
						}).catch(function () {
							_this4.loading = false;
							alert("Removal from group failed.");
							m.redraw();
						});
					}
				}, {
					key: 'unjoin',
					value: function unjoin() {
						// So: let's try to effect the actual unjoining of a group from here.
						this.loading = true;
						app.store.find('users', app.session.user.id()).then(this._unjoin.bind(this));
					}
				}, {
					key: 'list_of_sessions',
					value: function list_of_sessions() {
						var tags = app.store.all('tags');
						var currentTag = this.tag;

						var items = new ItemList();

						var currentPrimaryTag = currentTag ? currentTag.isChild() ? currentTag.parent() : currentTag : null;

						var addTag = function addTag(tag, indexSeq, fullArray) {
							var active = currentTag === tag;

							if (!active && currentTag) {
								active = currentTag.parent() === tag;
							}

							// CAREFUL: similar logic is found in addTagList.js !!!!
							if (tag.isChild() && tag.parent() === currentPrimaryTag) {
								items.add('tag' + tag.id(), TagLinkButton.component({
									label: 'Session ' + String(fullArray.length - indexSeq) + " of " + String(fullArray.length),
									idx: fullArray.length - indexSeq,
									tag: tag,
									params: this.params,
									active: active }), -10);
							}
						};

						// DFSKLARD: The listing of sessions.
						// DFSKLARD: my own attempts at a custom list of secondary tags to provide a list of sessions.
						// I ONLY SHOW THE subtags OF THE active primary tag.
						var filtered_tags = tags.filter(function (tag) {
							return tag.position() !== null && tag.isChild() && tag.parent() === currentPrimaryTag;
						});
						filtered_tags.reverse().forEach(addTag.bind(this));

						return items;
					}
				}, {
					key: 'launchTagEditor',
					value: function launchTagEditor() {
						app.modal.show(new EditTagModal({ tag: this.tag }));
					}
				}, {
					key: 'controlsForActionDropdown',
					value: function controlsForActionDropdown() {
						var items = new ItemList();

						// EDIT (only for the leader)
						// Incarnation #1:  a link back to formed.org:
						/*
      if (this.yesIAmTheLeaderOfThisGroup) {
      	items.add('edit', 
      		m("a", {href: app.siteSpecifics.fetchFormedURL()+"/dashboard?tab=customContent"}, 'Edit'));
      }*/
						// Incarnation #2: opening up the "edit-tag modal" dialog
						if (this.yesIAmTheLeaderOfThisGroup) {
							items.add('edit', Button.component({
								children: ['Edit'],
								onclick: this.launchTagEditor.bind(this)
							}));
						}

						// LEAVE GROUP (only if currently enrolled -- leaders are not allowed to leave)
						if (this.isMemberOfGroup && !this.yesIAmTheLeaderOfThisGroup) {
							items.add('leave', Button.component({
								children: ['Leave group'],
								onclick: this.unjoin.bind(this)
							}));
						}

						return items;
					}
				}, {
					key: 'view',
					value: function view() {

						/*	IF WE EVER WANT TO SHOW LEADER'S IDENTITY HERE.
      var leader = app.store.getById('users', parent.data.attributes.leaderUserId);
      // If the leader's full info is not yet fetched from API, start that process and set up the
      // promise to force a redraw of this component.
      if (!leader) {
      app.store.find('users', parent.data.attributes.leaderUserId).then(function(){
      m.redraw();
      })
      }
      <div class="group-leader-name">{leader ? ("This group's leader is: " + leader.data.attributes.displayName) : ''}</div>
      */

						var controlsForActionDropdown = this.controlsForActionDropdown().toArray();

						return m(
							'div',
							{ 'class': 'holder-marketing-block container', style: { "background-color": this.parent.data.attributes.color } },
							m(
								'table',
								{ 'class': 'marketing-block' },
								m(
									'tbody',
									null,
									m(
										'tr',
										{ 'class': 'marketing-block' },
										m(
											'td',
											{ 'class': 'leftside' },
											m(
												'div',
												{ 'class': 'group-name' },
												m.trust(this.parent.data.attributes.name)
											),
											m(
												'div',
												{ 'class': 'session-name' },
												m.trust("Session " + String(this.tag.data.attributes.position + 1) + ": " + this.tag.data.attributes.name)
											),
											m('hr', { 'class': 'under-session-name' }),
											m(
												'div',
												{ 'class': 'session-description' },
												m.trust(this.tag.data.attributes.description)
											)
										),
										m(
											'td',
											{ 'class': 'rightside-imageholder', style: { "background-image": "url(" + this.tag.data.attributes.backgroundImage + ")" } },
											m(
												'a',
												{ href: this.tag.data.attributes.linkDestination, target: '_fromflarumtoformed' },
												icon('play-circle', { className: 'play-icon' })
											)
										),
										m(
											'td',
											{ 'class': 'rightside-shim' },
											'\xA0'
										)
									)
								)
							),
							m(
								'div',
								{ 'class': 'marketing-block-footer' },
								controlsForActionDropdown.length ? m(
									'div',
									{ 'class': 'more-options' },
									m(
										Dropdown,
										{
											className: 'ExtensionListItem-controls',
											buttonClassName: 'Button Button--icon Button--flat',
											menuClassName: 'Dropdown-menu--right',
											label: 'More',
											icon: 'ellipsis-h' },
										controlsForActionDropdown
									)
								) : '',
								m(
									'div',
									{ 'class': 'session-chooser' },
									SelectDropdown.component({
										children: this.list_of_sessions().toArray(),
										buttonClassName: 'Button',
										className: 'App-titleControl'
									})
								),
								m(
									'div',
									{ 'class': 'num-of-members' },
									this.groupMembershipRoster ? UserRosterDropdown.component({
										userList: this.groupMembershipRoster
									}) : ' '
								),
								!this.isMemberOfGroup && !this.loading ? m(
									'div',
									{ 'class': 'join-or-leave', onclick: this.join.bind(this) },
									'JOIN'
								) : '',
								!this.isMemberOfGroup && this.loading ? LoadingIndicator.component({ className: 'upper-left-corner-absolute' }) : ''
							)
						);
					}
				}]);
				return TagHero;
			}(Component);

			_export('default', TagHero);
		}
	};
});;
'use strict';

System.register('flarum/tags/components/TagLinkButton', ['flarum/components/LinkButton', 'flarum/tags/helpers/tagIcon'], function (_export, _context) {
  "use strict";

  var LinkButton, tagIcon, TagLinkButton;
  return {
    setters: [function (_flarumComponentsLinkButton) {
      LinkButton = _flarumComponentsLinkButton.default;
    }, function (_flarumTagsHelpersTagIcon) {
      tagIcon = _flarumTagsHelpersTagIcon.default;
    }],
    execute: function () {
      TagLinkButton = function (_LinkButton) {
        babelHelpers.inherits(TagLinkButton, _LinkButton);

        function TagLinkButton() {
          babelHelpers.classCallCheck(this, TagLinkButton);
          return babelHelpers.possibleConstructorReturn(this, (TagLinkButton.__proto__ || Object.getPrototypeOf(TagLinkButton)).apply(this, arguments));
        }

        babelHelpers.createClass(TagLinkButton, [{
          key: 'view',
          value: function view() {
            var tag = this.props.tag;
            var active = this.constructor.isActive(this.props);
            var description = tag && tag.description();

            var isChild = false; // tag.isChild()

            // DFSKLARD removed hasIcon class from below
            // DFSKLARD removed the entire launcher image thumbnail that used to be a sibling of the div.label:
            /*
                <a className={'launcher-image ' + (active ? 'active ':'inactive') + (isChild ? 'child' : '')} 
                  href={this.props.href}
                  config={m.route}
                  style={{"background-image":"url("+tag.data.attributes.backgroundImage+")"}}
                  title={description || ''}>
                </a>
            */
            return m(
              'a',
              { className: 'TagLinkButton',
                href: this.props.href,
                config: m.route
              },
              m(
                'div',
                { className: 'label' },
                ' ',
                this.props.children,
                ' '
              )
            );
          }
        }], [{
          key: 'initProps',
          value: function initProps(props) {
            var tag = props.tag;

            props.params.tags = tag ? tag.slug() : 'untagged';
            props.href = app.route('tag', props.params);
            props.children = tag ? String(props.idx) + ': ' + tag.name() : app.translator.trans('flarum-tags.forum.index.untagged_link');
          }
        }]);
        return TagLinkButton;
      }(LinkButton);

      _export('default', TagLinkButton);
    }
  };
});;
'use strict';

System.register('flarum/tags/components/TagsPage', ['flarum/Component', 'flarum/components/IndexPage', 'flarum/helpers/listItems', 'flarum/helpers/humanTime', 'flarum/helpers/icon', 'flarum/tags/helpers/tagLabel', 'flarum/tags/utils/sortTags'], function (_export, _context) {
  "use strict";

  var Component, IndexPage, listItems, humanTime, icon, tagLabel, sortTags, TagsPage;
  return {
    setters: [function (_flarumComponent) {
      Component = _flarumComponent.default;
    }, function (_flarumComponentsIndexPage) {
      IndexPage = _flarumComponentsIndexPage.default;
    }, function (_flarumHelpersListItems) {
      listItems = _flarumHelpersListItems.default;
    }, function (_flarumHelpersHumanTime) {
      humanTime = _flarumHelpersHumanTime.default;
    }, function (_flarumHelpersIcon) {
      icon = _flarumHelpersIcon.default;
    }, function (_flarumTagsHelpersTagLabel) {
      tagLabel = _flarumTagsHelpersTagLabel.default;
    }, function (_flarumTagsUtilsSortTags) {
      sortTags = _flarumTagsUtilsSortTags.default;
    }],
    execute: function () {
      TagsPage = function (_Component) {
        babelHelpers.inherits(TagsPage, _Component);

        function TagsPage() {
          babelHelpers.classCallCheck(this, TagsPage);
          return babelHelpers.possibleConstructorReturn(this, (TagsPage.__proto__ || Object.getPrototypeOf(TagsPage)).apply(this, arguments));
        }

        babelHelpers.createClass(TagsPage, [{
          key: 'init',
          value: function init() {
            this.tags = sortTags(app.store.all('tags').filter(function (tag) {
              return !tag.parent();
            }));

            app.current = this;
            app.history.push('tags', icon('th-large'));
            app.drawer.hide();
            app.modal.close();
          }
        }, {
          key: 'view',
          value: function view() {
            var pinned = this.tags.filter(function (tag) {
              return tag.position() !== null;
            });
            var cloud = this.tags.filter(function (tag) {
              return tag.position() === null;
            });

            return m(
              'div',
              { className: 'TagsPage' },
              IndexPage.prototype.hero()
            );
          }
        }]);
        return TagsPage;
      }(Component);

      _export('default', TagsPage);
    }
  };
});;
'use strict';

System.register('flarum/tags/helpers/tagIcon', [], function (_export, _context) {
  "use strict";

  function tagIcon(tag) {
    var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    attrs.className = 'icon TagIcon ' + (attrs.className || '');

    if (tag) {
      attrs.style = attrs.style || {};
      attrs.style.backgroundColor = tag.color();
    } else {
      attrs.className += ' untagged';
    }

    return m('span', attrs);
  }

  _export('default', tagIcon);

  return {
    setters: [],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/helpers/tagLabel', ['flarum/utils/extract'], function (_export, _context) {
  "use strict";

  var extract;
  function tagLabel(tag) {
    var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    attrs.style = attrs.style || {};
    attrs.className = 'TagLabel ' + (attrs.className || '');

    var link = extract(attrs, 'link');

    if (tag) {
      var color = tag.color();
      if (color) {
        attrs.style.backgroundColor = attrs.style.color = color;
        attrs.className += ' colored';
      }

      if (link) {
        attrs.title = tag.description() || '';
        attrs.href = app.route('tag', { tags: tag.slug() });
        attrs.config = m.route;
      }
    } else {
      attrs.className += ' untagged';
    }

    var textToShow = options.textToShow ? options.textToShow : tag ? tag.name() : app.translator.trans('flarum-tags.lib.deleted_tag_text');

    return m(link ? 'a' : 'span', attrs, m(
      'span',
      { className: 'TagLabel-text' },
      textToShow
    ));
  }

  _export('default', tagLabel);

  return {
    setters: [function (_flarumUtilsExtract) {
      extract = _flarumUtilsExtract.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/helpers/tagsLabel', ['flarum/utils/extract', 'flarum/tags/helpers/tagLabel', 'flarum/tags/utils/sortTags'], function (_export, _context) {
  "use strict";

  var extract, tagLabel, sortTags;
  function tagsLabel(tags) {
    var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var children = [];
    var link = extract(attrs, 'link');

    attrs.className = 'TagsLabel ' + (attrs.className || '');

    // DFSKLARD: I'm really abusing this "hook" for my own purposes.
    // I have no intent to return any real element here.
    // I am using this hook to place an anchor tag into the
    // .nav-up scaffolding.

    if (tags) {
      sortTags(tags).forEach(function (tag) {
        if (tag || tags.length === 1) {
          // DFSKLARD: We only want emission for the primary tag (repr the group as a whole)
          if (tag.data.attributes.isChild === true) {
            var linkelem = tagLabel(tag, { link: link }, { textToShow: "Up to Group Home" });
            // interestirng fields:
            // linkelem.attrs.className
            // attrs.href
            $('.nav-up').empty().append($('<a href="' + linkelem.attrs.href + '">&lt; Back to group</a>'));
          }
        }
      });
    }

    return m('span', attrs);
  }

  _export('default', tagsLabel);

  return {
    setters: [function (_flarumUtilsExtract) {
      extract = _flarumUtilsExtract.default;
    }, function (_flarumTagsHelpersTagLabel) {
      tagLabel = _flarumTagsHelpersTagLabel.default;
    }, function (_flarumTagsUtilsSortTags) {
      sortTags = _flarumTagsUtilsSortTags.default;
    }],
    execute: function () {}
  };
});;
'use strict';

System.register('flarum/tags/main', ['flarum/Model', 'flarum/models/Discussion', 'flarum/components/IndexPage', 'flarum/tags/models/Tag', 'flarum/tags/components/TagsPage', 'flarum/tags/components/DiscussionTaggedPost', 'flarum/tags/addTagList', 'flarum/tags/addTagFilter', 'flarum/tags/addTagLabels', 'flarum/tags/addTagControl', 'flarum/tags/addTagComposer'], function (_export, _context) {
  "use strict";

  var Model, Discussion, IndexPage, Tag, TagsPage, DiscussionTaggedPost, addTagList, addTagFilter, addTagLabels, addTagControl, addTagComposer;
  return {
    setters: [function (_flarumModel) {
      Model = _flarumModel.default;
    }, function (_flarumModelsDiscussion) {
      Discussion = _flarumModelsDiscussion.default;
    }, function (_flarumComponentsIndexPage) {
      IndexPage = _flarumComponentsIndexPage.default;
    }, function (_flarumTagsModelsTag) {
      Tag = _flarumTagsModelsTag.default;
    }, function (_flarumTagsComponentsTagsPage) {
      TagsPage = _flarumTagsComponentsTagsPage.default;
    }, function (_flarumTagsComponentsDiscussionTaggedPost) {
      DiscussionTaggedPost = _flarumTagsComponentsDiscussionTaggedPost.default;
    }, function (_flarumTagsAddTagList) {
      addTagList = _flarumTagsAddTagList.default;
    }, function (_flarumTagsAddTagFilter) {
      addTagFilter = _flarumTagsAddTagFilter.default;
    }, function (_flarumTagsAddTagLabels) {
      addTagLabels = _flarumTagsAddTagLabels.default;
    }, function (_flarumTagsAddTagControl) {
      addTagControl = _flarumTagsAddTagControl.default;
    }, function (_flarumTagsAddTagComposer) {
      addTagComposer = _flarumTagsAddTagComposer.default;
    }],
    execute: function () {

      app.initializers.add('flarum-tags', function (app) {
        app.routes.tags = { path: '/tags', component: TagsPage.component() };

        // DFSKLARD: This is the ROUTE that is our go-to-commgroup homepage.
        app.routes.tag = { path: '/t/:tags', component: IndexPage.component() };

        app.route.tag = function (tag) {
          return app.route('tag', { tags: tag.slug() });
        };

        app.postComponents.discussionTagged = DiscussionTaggedPost;

        app.store.models.tags = Tag;

        Discussion.prototype.tags = Model.hasMany('tags');
        Discussion.prototype.canTag = Model.attribute('canTag');

        addTagList();
        addTagFilter();
        addTagLabels();
        addTagControl();
        addTagComposer();
      });
    }
  };
});;
'use strict';

System.register('flarum/tags/models/Tag', ['flarum/Model', 'flarum/utils/mixin', 'flarum/utils/computed'], function (_export, _context) {
  "use strict";

  var Model, mixin, computed, Tag;
  return {
    setters: [function (_flarumModel) {
      Model = _flarumModel.default;
    }, function (_flarumUtilsMixin) {
      mixin = _flarumUtilsMixin.default;
    }, function (_flarumUtilsComputed) {
      computed = _flarumUtilsComputed.default;
    }],
    execute: function () {
      Tag = function (_mixin) {
        babelHelpers.inherits(Tag, _mixin);

        function Tag() {
          babelHelpers.classCallCheck(this, Tag);
          return babelHelpers.possibleConstructorReturn(this, (Tag.__proto__ || Object.getPrototypeOf(Tag)).apply(this, arguments));
        }

        return Tag;
      }(mixin(Model, {
        name: Model.attribute('name'),
        slug: Model.attribute('slug'),
        description: Model.attribute('description'),

        color: Model.attribute('color'),
        backgroundUrl: Model.attribute('backgroundUrl'),
        backgroundMode: Model.attribute('backgroundMode'),

        linkDestination: Model.attribute('linkDestination'),
        backgroundImage: Model.attribute('backgroundImage'),

        leaderUserId: Model.attribute('leaderUserId'),

        position: Model.attribute('position'),
        parent: Model.hasOne('parent'),
        defaultSort: Model.attribute('defaultSort'),
        isChild: Model.attribute('isChild'),
        isHidden: Model.attribute('isHidden'),

        discussionsCount: Model.attribute('discussionsCount'),
        lastTime: Model.attribute('lastTime', Model.transformDate),
        lastDiscussion: Model.hasOne('lastDiscussion'),

        isRestricted: Model.attribute('isRestricted'),
        canStartDiscussion: Model.attribute('canStartDiscussion'),
        canAddToDiscussion: Model.attribute('canAddToDiscussion'),

        // DFSKLARD; I removed any dependency on the value of "position"
        isPrimary: computed('position', 'parent', function (position, parent) {
          return parent === false;
        })
      }));

      _export('default', Tag);
    }
  };
});;
'use strict';

System.register('flarum/tags/utils/sortTags', [], function (_export, _context) {
  "use strict";

  function sortTags(tags) {
    return tags.slice(0).sort(function (a, b) {
      var aPos = a.position();
      var bPos = b.position();

      // If they're both second-level tags, sort them by their ID because that
      // tells us about their relative "birth" times.
      // DFSKLARD changed this from previous sort-by-discussion-count.
      if (a.data.attributes.isChild && b.data.attributes.isChild) {
        console.log('-------');
        console.log(a.data.id);
        console.log(b.data.id);
        console.log(b.data.id - a.data.id);
        return b.data.id - a.data.id;
      }

      // If just one is a secondary tag, then the primary tag should
      // come first.
      if (bPos === null) return -1;
      if (aPos === null) return 1;

      // If we've made it this far, we know they're both primary tags. So we'll
      // need to see if they have parents.
      var aParent = a.parent();
      var bParent = b.parent();

      // If they both have the same parent, then their positions are local,
      // so we can compare them directly.
      if (aParent === bParent) return aPos - bPos;

      // If they are both child tags, then we will compare the positions of their
      // parents.
      else if (aParent && bParent) return aParent.position() - bParent.position();

        // If we are comparing a child tag with its parent, then we let the parent
        // come first. If we are comparing an unrelated parent/child, then we
        // compare both of the parents.
        else if (aParent) return aParent === b ? 1 : aParent.position() - bPos;else if (bParent) return bParent === a ? -1 : aPos - bParent.position();

      return 0;
    });
  }

  _export('default', sortTags);

  return {
    setters: [],
    execute: function () {}
  };
});