import LinkButton from 'flarum/components/LinkButton';
import tagIcon from 'flarum/tags/helpers/tagIcon';

export default class TagLinkButton extends LinkButton {
  view() {
    const tag = this.props.tag;
    const active = this.constructor.isActive(this.props);
    const description = tag && tag.description();

    const isChild = false;  // tag.isChild()

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
    return (
      <a className='TagLinkButton'
         href={this.props.href}
         config={m.route}
      >
        <div className='label'> {this.props.children} </div>
      </a>
    );
  }


  static initProps(props) {
    const tag = props.tag;

    props.params.tags = tag ? tag.slug() : 'untagged';
    props.href = app.route('tag', props.params);
    props.children = tag ? (String(props.idx) + ': ' + tag.name()) : app.translator.trans('flarum-tags.forum.index.untagged_link');
  }
}
