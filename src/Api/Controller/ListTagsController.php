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

use Flarum\Api\Controller\AbstractCollectionController;
use Flarum\Tags\Api\Serializer\TagSerializer;
use Flarum\Tags\Tag;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class ListTagsController extends AbstractCollectionController
{
    /**
     * {@inheritdoc}
     */
    public $serializer = TagSerializer::class;

    /**
     * {@inheritdoc}
     */
    public $include = [
        'parent',
    ];

    /**
     * {@inheritdoc}
     */
    public $optionalInclude = [
        'lastDiscussion',
    ];

    /**
     * @var \Flarum\Tags\Tag
     */
    protected $tags;

    /**
     * @param \Flarum\Tags\Tag $tags
     */
    public function __construct(Tag $tags)
    {
        $this->tags = $tags;
    }

    /**
     * {@inheritdoc}
     */
    protected function data(ServerRequestInterface $request, Document $document)
    {
        $slug_or_id = array_get($request->getQueryParams(), 'id');  // NOT REQUIRED!
        $actor = $request->getAttribute('actor');
        $include = $this->extractInclude($request);

        if ( ! $slug_or_id)
            $tags = $this->tags->whereVisibleTo($actor)->withStateFor($actor)->get();
        else {
            $tags = $this->tags->where('slug', $slug_or_id)->get();
            if (count($tags) < 1) {
                $tags = $this->tags->where('id', $slug_or_id)->get();                
            }
        }

        return $tags->load($include);
    }
}
