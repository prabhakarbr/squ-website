<?php

namespace Drupal\lite_youtube_embed\Plugin\Field\FieldFormatter;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Config\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\Core\Url;
use Drupal\media\Entity\MediaType;
use Drupal\media\IFrameUrlHelper;
use Drupal\media\OEmbed\Resource;
use Drupal\media\OEmbed\ResourceException;
use Drupal\media\OEmbed\ResourceFetcherInterface;
use Drupal\media\OEmbed\UrlResolverInterface;
use Drupal\media\Plugin\media\Source\OEmbedInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Plugin implementation of the 'lite_youtube_embed' formatter.
 *
 * This plugin uses Paul Irish's Lite YouTube embed plugin for YouTube videos,
 * with fallback to generic oEmbed formatter logic. The plugin does not inherit
 * from OEmbedFormatter though, because on the one hand that plugin is marked as
 * internal, on the other hand, we'd need to override the viewElements() logic
 * anyway in order to be able to insert our specific logic.
 *
 * @FieldFormatter(
 *   id = "lite_youtube_embed",
 *   label = @Translation("Lite YouTube embed (with oEmbed fallback)"),
 *   field_types = {
 *     "link",
 *     "string",
 *     "string_long",
 *   },
 * )
 */
class LiteYoutubeEmbedFormatter extends FormatterBase {

  /**
   * The oEmbed resource fetcher.
   *
   * @var \Drupal\media\OEmbed\ResourceFetcherInterface
   */
  protected ResourceFetcherInterface $resourceFetcher;

  /**
   * The oEmbed URL resolver service.
   *
   * @var \Drupal\media\OEmbed\UrlResolverInterface
   */
  protected UrlResolverInterface $urlResolver;

  /**
   * The logger service.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected LoggerInterface $logger;

  /**
   * The media settings config.
   *
   * @var \Drupal\Core\Config\Config
   */
  protected Config $config;

  /**
   * The iFrame URL helper service.
   *
   * @var \Drupal\media\IFrameUrlHelper
   */
  protected IFrameUrlHelper $iFrameUrlHelper;

  /**
   * Constructs an LiteYoutubeEmbedFormatter instance.
   *
   * @param string $plugin_id
   *   The plugin ID for the formatter.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The definition of the field to which the formatter is associated.
   * @param array $settings
   *   The formatter settings.
   * @param string $label
   *   The formatter label display setting.
   * @param string $view_mode
   *   The view mode.
   * @param array $third_party_settings
   *   Any third party settings.
   * @param \Drupal\Core\Messenger\MessengerInterface $messenger
   *   The messenger service.
   * @param \Drupal\media\OEmbed\ResourceFetcherInterface $resource_fetcher
   *   The oEmbed resource fetcher service.
   * @param \Drupal\media\OEmbed\UrlResolverInterface $url_resolver
   *   The oEmbed URL resolver service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory service.
   * @param \Drupal\media\IFrameUrlHelper $iframe_url_helper
   *   The iFrame URL helper service.
   */
  public function __construct($plugin_id, $plugin_definition, FieldDefinitionInterface $field_definition, array $settings, $label, $view_mode, array $third_party_settings, MessengerInterface $messenger, ResourceFetcherInterface $resource_fetcher, UrlResolverInterface $url_resolver, LoggerChannelFactoryInterface $logger_factory, ConfigFactoryInterface $config_factory, IFrameUrlHelper $iframe_url_helper) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);

    $this->messenger = $messenger;
    $this->resourceFetcher = $resource_fetcher;
    $this->urlResolver = $url_resolver;
    $this->logger = $logger_factory->get('media');
    $this->config = $config_factory->get('media.settings');
    $this->iFrameUrlHelper = $iframe_url_helper;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['label'],
      $configuration['view_mode'],
      $configuration['third_party_settings'],
      $container->get('messenger'),
      $container->get('media.oembed.resource_fetcher'),
      $container->get('media.oembed.url_resolver'),
      $container->get('logger.factory'),
      $container->get('config.factory'),
      $container->get('media.oembed.iframe_url_helper')
    );
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return [
      'max_width' => 0,
      'max_height' => 0,
    ] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $element = [];
    $max_width = $this->getSetting('max_width');
    $max_height = $this->getSetting('max_height');

    foreach ($items as $delta => $item) {
      $main_property = $item->getFieldDefinition()->getFieldStorageDefinition()->getMainPropertyName();
      $value = $item->{$main_property};

      if (empty($value)) {
        continue;
      }

      try {
        $resource_url = $this->urlResolver->getResourceUrl($value, $max_width, $max_height);
        $resource = $this->resourceFetcher->fetchResource($resource_url);
      }
      catch (ResourceException $exception) {
        $this->logger->error("Could not retrieve the remote URL (@url).", ['@url' => $value]);
        continue;
      }

      if ($resource->getType() === Resource::TYPE_LINK) {
        $element[$delta] = [
          '#title' => $resource->getTitle(),
          '#type' => 'link',
          '#url' => Url::fromUri($value),
        ];
      }
      elseif ($resource->getType() === Resource::TYPE_PHOTO) {
        $element[$delta] = [
          '#theme' => 'image',
          '#uri' => $resource->getUrl()->toString(),
          '#width' => $max_width ?: $resource->getWidth(),
          '#height' => $max_height ?: $resource->getHeight(),
        ];
      }
      else {
        if (($provider = $resource->getProvider()) && $provider->getName() === 'YouTube' && $youtube_id = $this->parseYouTubeId($value)) {
          $element[$delta] = [
            '#theme' => 'lite_youtube_embed',
            '#video_id' => $youtube_id,
            '#label' => $resource->getTitle(),
            '#entity' => $items->getEntity(),
            '#attached' => [
              'library' => [
                'lite_youtube_embed/lite_youtube_embed',
              ],
            ],
          ];
        }
        else {
          $url = Url::fromRoute('media.oembed_iframe', [], [
            'query' => [
              'url' => $value,
              'max_width' => $max_width,
              'max_height' => $max_height,
              'hash' => $this->iFrameUrlHelper->getHash($value, $max_width, $max_height),
            ],
          ]);

          $domain = $this->config->get('iframe_domain');
          if ($domain) {
            $url->setOption('base_url', $domain);
          }

          // Render videos and rich content in an iframe for security reasons.
          // @see: https://oembed.com/#section3
          $element[$delta] = [
            '#type' => 'html_tag',
            '#tag' => 'iframe',
            '#attributes' => [
              'src' => $url->toString(),
              'frameborder' => 0,
              'scrolling' => FALSE,
              'allowtransparency' => TRUE,
              'width' => $max_width ?: $resource->getWidth(),
              'height' => $max_height ?: $resource->getHeight(),
              'class' => ['media-oembed-content'],
            ],
            '#attached' => [
              'library' => [
                'media/oembed.formatter',
              ],
            ],
          ];

          // An empty title attribute will disable title inheritance, so only
          // add it if the resource has a title.
          $title = $resource->getTitle();
          if ($title) {
            $element[$delta]['#attributes']['title'] = $title;
          }
        }

        CacheableMetadata::createFromObject($resource)
          ->addCacheTags($this->config->getCacheTags())
          ->applyTo($element[$delta]);
      }
    }
    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    return parent::settingsForm($form, $form_state) + [
      'max_width' => [
        '#type' => 'number',
        '#title' => $this->t('Maximum width'),
        '#description' => $this->t('Note, that this setting is only used for non-YouTube providers.'),
        '#default_value' => $this->getSetting('max_width'),
        '#size' => 5,
        '#maxlength' => 5,
        '#field_suffix' => $this->t('pixels'),
        '#min' => 0,
      ],
      'max_height' => [
        '#type' => 'number',
        '#title' => $this->t('Maximum height'),
        '#description' => $this->t('Note, that this setting is only used for non-YouTube providers.'),
        '#default_value' => $this->getSetting('max_height'),
        '#size' => 5,
        '#maxlength' => 5,
        '#field_suffix' => $this->t('pixels'),
        '#min' => 0,
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = parent::settingsSummary();

    if ($this->getSetting('max_width') && $this->getSetting('max_height')) {
      $summary[] = $this->t('Maximum size: %max_width x %max_height pixels', [
        '%max_width' => $this->getSetting('max_width'),
        '%max_height' => $this->getSetting('max_height'),
      ]);
    }
    elseif ($this->getSetting('max_width')) {
      $summary[] = $this->t('Maximum width: %max_width pixels', [
        '%max_width' => $this->getSetting('max_width'),
      ]);
    }
    elseif ($this->getSetting('max_height')) {
      $summary[] = $this->t('Maximum height: %max_height pixels', [
        '%max_height' => $this->getSetting('max_height'),
      ]);
    }
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public static function isApplicable(FieldDefinitionInterface $field_definition) {
    if ($field_definition->getTargetEntityTypeId() !== 'media') {
      return FALSE;
    }

    if (parent::isApplicable($field_definition)) {
      $media_type = $field_definition->getTargetBundle();

      if ($media_type) {
        $media_type = MediaType::load($media_type);
        return $media_type && $media_type->getSource() instanceof OEmbedInterface;
      }
    }
    return FALSE;
  }

  /**
   * Parses the video ID from a given YouTube URL.
   *
   * Big shoutout to https://github.com/waynestate/parse-youtube-id.
   *
   * @param string $url
   *   The url.
   *
   * @return string
   *   The YouTube video ID.
   */
  protected function parseYouTubeId(string $url): string {
    // Optional URL scheme. Either http, or https, or protocol-relative.
    $pattern_scheme = '#^(?:https?://|//)?';
    // Optional www or m subdomain.
    $pattern_domain = '(?:www\.|m\.)?';

    // Group host alternatives...
    $pattern_group_host = '(?:';
    // Either youtu.be or youtube.com.
    $pattern_group_host .= 'youtu\.be/|youtube\.com/';
    // Group path alternatives...
    $pattern_group_host .= '(?:';
    // Either /embed/ or /v/ or /watch?v= or /watch?other_param&v=. or shorts/.
    $pattern_group_host .= 'embed/|v/|watch\?v=|watch\?.+&v=|shorts/';
    // End path alternatives.
    $pattern_group_host .= ')';
    // End host alternatives.
    $pattern_group_host .= ')';

    // 11 characters (Length of YouTube video IDs).
    $pattern_id = '([\w-]{11})';
    // Rejects if overlong id.
    $pattern_id .= '(?![\w-])#';

    $pattern = $pattern_scheme . $pattern_domain . $pattern_group_host . $pattern_id;
    preg_match($pattern, $url, $matches);

    return $matches[1] ?? '';
  }

}
