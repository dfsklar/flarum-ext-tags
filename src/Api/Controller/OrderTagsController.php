<?php

/*
 * This file is part of Flarum.
 *
 * (c) Toby Zerner <toby.zerner@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Flarum\Tags\Api\Controller;

use Flarum\Core\Access\AssertPermissionTrait;
use Flarum\Http\Controller\ControllerInterface;
use Flarum\Tags\Tag;
use Psr\Http\Message\ServerRequestInterface;
use Zend\Diactoros\Response\EmptyResponse;

/*

In original Flarum (pre-Sklar), the incoming data (having key of 'order') would be an array of orderSpecs, with each
orderSpec having this form (JavaScript syntax):
    {
      id: parseInt(this.parentTag.id()),
      children: [ 3, 6, 88, 9842 ]
    }

In new Sklar-based flarum, the object can be alternatively be presented with a key of 'orderviz', in
which case each orderSpec has this form :
    {
        id: ____,
        children: [
            {id: ___, visible: true/false}
        ]
    }

*/

class OrderTagsController implements ControllerInterface
{
    use AssertPermissionTrait;

    /**
     * {@inheritdoc}
     */
    public function handle(ServerRequestInterface $request)
    {
        // DFSKLARD: We allow anyone to reorder sessions, so we must eliminate this:
        // $this->assertAdmin($request->getAttribute('actor'));


        // OLD SCHOOL (for back-compat):
        $order = array_get($request->getParsedBody(), 'order');
        if ($order) {

            // DFSKLARD: This appears to be a "trash the entire database and then reconstruct"
            // action, and we do not want to require that each request rebuild the entire
            // universe of child/parent relationships.  So this is being disabled:
            /*
            Tag::query()->update([
                'position' => null,
                'parent_id' => null
            ]); */

            foreach ($order as $i => $orderSpec) {
                $parentId = array_get($orderSpec, 'id');

                // DFSKLARD: We do not really have the concept of ordering "parent tags".
                // We only order sessions within commgroups.  So we disable this:
                // Tag::where('id', $parentId)->update(['position' => $i]);

                if (isset($orderSpec['children']) && is_array($orderSpec['children'])) {
                    foreach ($orderSpec['children'] as $j => $childId) {
                        Tag::where('id', $childId)->update([
                            'position' => $j,
                            'parent_id' => $parentId
                        ]);
                    }
                }
            }
        }


        // NEW TECHNIQUE supports visibility control simultaneously:
        $order = array_get($request->getParsedBody(), 'orderviz');
        if ($order) {
            foreach ($order as $i => $orderSpec) {
                $parentId = array_get($orderSpec, 'id');
                if (isset($orderSpec['children']) && is_array($orderSpec['children'])) {
                    foreach ($orderSpec['children'] as $j => $x) {
                        $childId = $x['id'];
                        Tag::where('id', $childId)->update([
                            'position' => $j,
                            'parent_id' => $parentId,
                            'is_hidden' => ( ! ($x['visible']))
                        ]);
                    }
                }
            }
        }

        return new EmptyResponse(204);
    }
}
