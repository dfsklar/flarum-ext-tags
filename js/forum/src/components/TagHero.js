import Component from 'flarum/Component';

export default class TagHero extends Component {
  view() {
    const tag = this.props.tag;
    const color = tag.color();

      return (
	      <table class="marketing-block">
	      <tbody><tr class="marketing-block">
	      <td class="leftside">
	      <div class="group-name">The YOUNG MARRIEDS Group</div>
	      <div class="group-leader-name">[name of this group's leader]</div>
	      <div class="group-summary">This hero area is hardwired for demo - it is not yet dynamic!  Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.</div>
	      <div class="button-join-group"> JOIN GROUP button (if you are not a member yet)</div>
				</td>
	      <td class="rightside">
	        <img src="http://res.cloudinary.com/hir7sbm3c/image/upload/c_fill/cc-uploads/itmjlbgk5cpsrilkltax.jpg"></img>
					<div class='commentary'>This is a thumbnail and "play-launcher" for whatever is the media item for the currently-selected SESSION! </div>
				</td>
	      </tr>
	      </tbody></table>
    );
  }
}
