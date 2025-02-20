import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdListAlt, MdSettings, MdShare} from 'react-icons/md'
import {Button, Drawer, Form, Input, Message, Nav, Panel, TagPicker, Toggle} from 'rsuite'

import {ImageRefFragment} from '../api'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ListInput, ListValue} from '../atoms/listInput'
import {
  authorise,
  createCheckedPermissionComponent,
  PermissionControl
} from '../atoms/permissionControl'
import {Textarea} from '../atoms/textarea'
import {MetaDataType} from '../blocks/types'
import {generateID} from '../utility'
import {ImageEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

export interface PageMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface PageMetadata {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly url: string
  readonly properties: PageMetadataProperty[]
  readonly image?: ImageRefFragment
  readonly socialMediaTitle?: string
  readonly socialMediaDescription?: string
  readonly socialMediaImage?: ImageRefFragment
}

export interface PageMetadataPanelProps {
  readonly value: PageMetadata

  onClose?(): void

  onChange?(value: PageMetadata): void
}

function PageMetadataPanel({value, onClose, onChange}: PageMetadataPanelProps) {
  const {
    title,
    description,
    slug,
    tags,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    properties
  } = value

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [activeKey, setActiveKey] = useState(MetaDataType.General)

  const isAuthorized = authorise('CAN_CREATE_PAGE')

  const [metaDataProperties, setMetadataProperties] = useState<ListValue<PageMetadataProperty>[]>(
    properties
      ? properties.map(metaDataProperty => ({
          id: generateID(),
          value: metaDataProperty
        }))
      : []
  )

  const {t} = useTranslation()

  useEffect(() => {
    if (metaDataProperties) {
      onChange?.({...value, properties: metaDataProperties.map(({value}) => value)})
    }
  }, [metaDataProperties])

  function handleImageChange(currentImage: ImageRefFragment) {
    switch (activeKey) {
      case MetaDataType.General: {
        const image = currentImage
        onChange?.({...value, image})
        break
      }
      case MetaDataType.SocialMedia: {
        const socialMediaImage = currentImage
        onChange?.({...value, socialMediaImage})
        break
      }
      default: {
      }
    }
  }

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <>
            <Form.Group>
              <Message showIcon type="info">
                {t('pageEditor.panels.metadataInfo')}
              </Message>
            </Form.Group>
            <Form.Group controlId="socialMediaTitle">
              <Form.ControlLabel>{t('pageEditor.panels.socialMediaTitle')}</Form.ControlLabel>
              <Form.Control
                name="social-media-title"
                value={socialMediaTitle}
                onChange={(socialMediaTitle: string) => {
                  onChange?.({...value, socialMediaTitle})
                }}
              />
            </Form.Group>
            <Form.Group controlId="socialMediaDescription">
              <Form.ControlLabel>{t('pageEditor.panels.socialMediaDescription')}</Form.ControlLabel>
              <Form.Control
                name="social-media-description"
                rows={5}
                accepter={Textarea}
                value={socialMediaDescription}
                onChange={(socialMediaDescription: string) => {
                  onChange?.({...value, socialMediaDescription})
                }}
              />
            </Form.Group>
            <Form.Group controlId="socialMediaImage">
              <Form.ControlLabel>{t('pageEditor.panels.socialMediaImage')}</Form.ControlLabel>
              <ChooseEditImage
                header={''}
                image={socialMediaImage}
                disabled={false}
                openChooseModalOpen={() => {
                  setChooseModalOpen(true)
                }}
                openEditModalOpen={() => {
                  setEditModalOpen(true)
                }}
                removeImage={() => onChange?.({...value, socialMediaImage: undefined})}
              />
            </Form.Group>
          </>
        )
      case MetaDataType.General:
        return (
          <>
            <Form.Group controlId="pageSlug">
              <Form.ControlLabel>{t('pageEditor.panels.slug')}</Form.ControlLabel>
              <Form.Control
                name="slug"
                value={slug}
                onChange={(slug: string) => onChange?.({...value, slug})}
              />
            </Form.Group>
            <Form.Group controlId="pageTitle">
              <Form.ControlLabel>{t('pageEditor.panels.title')}</Form.ControlLabel>
              <Form.Control
                name="title"
                value={title}
                onChange={(title: string) => onChange?.({...value, title})}
              />
              <Form.HelpText>{t('pageEditor.panels.titleHelpBlock')}</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="pageDescription">
              <Form.ControlLabel>{t('pageEditor.panels.description')}</Form.ControlLabel>
              <Form.Control
                name="description"
                accepter={Textarea}
                value={description}
                onChange={(description: string) => onChange?.({...value, description})}
              />
              <Form.HelpText>{t('pageEditor.panels.descriptionHelpBlock')}</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="pageTags">
              <Form.ControlLabel>{t('pageEditor.panels.tags')}</Form.ControlLabel>
              <TagPicker
                disabled={!isAuthorized}
                virtualized
                style={{width: '100%'}}
                creatable
                value={tags}
                data={tags.map(tag => ({label: tag, value: tag}))}
                onChange={tagsValue => onChange?.({...value, tags: tagsValue ?? []})}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('pageEditor.panels.postImage')}</Form.ControlLabel>
              <ChooseEditImage
                header={''}
                image={image}
                disabled={false}
                openChooseModalOpen={() => {
                  setChooseModalOpen(true)
                }}
                openEditModalOpen={() => {
                  setEditModalOpen(true)
                }}
                removeImage={() => onChange?.({...value, image: undefined})}
              />
            </Form.Group>
          </>
        )
      case MetaDataType.Properties:
        return (
          <>
            <Form.Group>
              <Message showIcon type="info">
                {t('pageEditor.panels.propertiesInfo')}
              </Message>
            </Form.Group>
            <Form.Group controlId="pageProperties">
              <Form.ControlLabel>{t('pageEditor.panels.properties')}</Form.ControlLabel>
              <ListInput
                disabled={!isAuthorized}
                value={metaDataProperties}
                onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}
                defaultValue={{key: '', value: '', public: true}}>
                {({value, onChange}) => (
                  <div style={{display: 'flex', flexDirection: 'row'}}>
                    <Input
                      placeholder={t('pageEditor.panels.key')}
                      style={{
                        width: '40%',
                        marginRight: '10px'
                      }}
                      value={value.key}
                      onChange={propertyKey => {
                        onChange({...value, key: propertyKey})
                      }}
                    />
                    <Input
                      placeholder={t('pageEditor.panels.value')}
                      style={{
                        width: '60%'
                      }}
                      value={value.value}
                      onChange={propertyValue => {
                        onChange({...value, value: propertyValue})
                      }}
                    />
                    <Form.Group style={{paddingTop: '6px', paddingLeft: '8px'}}>
                      <Toggle
                        style={{maxWidth: '70px', minWidth: '70px'}}
                        checkedChildren={t('pageEditor.panels.public')}
                        unCheckedChildren={t('pageEditor.panels.private')}
                        checked={value.public}
                        onChange={isPublic => onChange({...value, public: isPublic})}
                      />
                    </Form.Group>
                  </div>
                )}
              </ListInput>
            </Form.Group>
          </>
        )
      default:
        return <></>
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.metadata')}</Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
            <Button appearance="primary" onClick={() => onClose?.()}>
              {t('saveAndClose')}
            </Button>
          </PermissionControl>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={activeKey}
          onSelect={activeKey => setActiveKey(activeKey)}
          style={{marginBottom: 20}}>
          <Nav.Item eventKey={MetaDataType.General} icon={<MdSettings />}>
            {t('articleEditor.panels.general')}
          </Nav.Item>
          <Nav.Item eventKey={MetaDataType.SocialMedia} icon={<MdShare />}>
            {t('articleEditor.panels.socialMedia')}
          </Nav.Item>
          <Nav.Item eventKey={MetaDataType.Properties} icon={<MdListAlt />}>
            {t('pageEditor.panels.properties')}
          </Nav.Item>
        </Nav>

        <Panel>
          <Form fluid disabled={!isAuthorized}>
            {currentContent()}
          </Form>
        </Panel>
      </Drawer.Body>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: ImageRefFragment) => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {(value.image || value.socialMediaImage) && (
        <Drawer
          open={isEditModalOpen}
          size="sm"
          onClose={() => {
            setEditModalOpen(false)
          }}>
          <ImageEditPanel
            id={activeKey === MetaDataType.General ? value.image?.id : value.socialMediaImage?.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGE',
  'CAN_GET_PAGES',
  'CAN_CREATE_PAGE',
  'CAN_DELETE_PAGE',
  'CAN_PUBLISH_PAGE'
])(PageMetadataPanel)
export {CheckedPermissionComponent as PageMetadataPanel}
