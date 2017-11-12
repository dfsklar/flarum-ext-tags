import LinkButton from 'flarum/components/LinkButton';
import tagIcon from 'flarum/tags/helpers/tagIcon';

export default class TagLinkButton extends LinkButton {
  view() {
    const tag = this.props.tag;
    const active = this.constructor.isActive(this.props);
    const description = tag && tag.description();

    const isChild = false;  // tag.isChild()

    // DFSKLARD removed hasIcon class from below
    return (
      <a className={'TagLinkButton ' + (active ? 'active ':'inactive') + (isChild ? 'child' : '')} href={this.props.href} config={m.route}
        style={active && tag ? {color: tag.color()} : ''}
        title={description || ''}>
        <img className='TagLinkButtonImage' src='http://res.cloudinary.com/hir7sbm3c/image/upload/c_fill/cc-uploads/itmjlbgk5cpsrilkltax.jpg'></img>
        <div className='holder'>
          {this.props.children}
        </div>
      </a>
    );
  }

  static initProps(props) {
    const tag = props.tag;

    props.params.tags = tag ? tag.slug() : 'untagged';
    props.href = app.route('tag', props.params);
    props.children = tag ? tag.name() : app.translator.trans('flarum-tags.forum.index.untagged_link');
  }
}
