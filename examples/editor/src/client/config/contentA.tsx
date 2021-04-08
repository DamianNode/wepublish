import React, {useCallback, useContext, useMemo, useState} from 'react'
import {
  Button,
  Icon,
  Col,
  ControlLabel,
  FormControl,
  Grid,
  Modal,
  Row,
  SelectPicker,
  Panel
} from 'rsuite'
import {isFunctionalUpdate} from '@karma.run/react'
import {
  RichTextBlock,
  RichTextBlockValue,
  Reference,
  RefSelectModal,
  MediaReferenceType,
  ReferenceButton
} from '@wepublish/editor'
import {ContentContextEnum} from './article/api'
import {ConfigContext} from '@wepublish/editor/src/client/Editorcontext'
import {I18nWrapper} from './i18nWrapper'

export interface ContentA_EditViewValue {
  readonly myString: string
  readonly myStringI18n: {
    [lang: string]: string
  }
  readonly myRichText: RichTextBlockValue
  readonly myRef?: Reference | null
}

export interface ContentA_EditViewProps {
  readonly value: ContentA_EditViewValue
  readonly onChange: React.Dispatch<React.SetStateAction<ContentA_EditViewValue>>
}

export function ContentA_EditView({value, onChange}: ContentA_EditViewProps) {
  if (!value) {
    return null
  }

  const config = useContext(ConfigContext)
  const [editLang, setEditLang] = useState(config.lang.languages[0].tag)
  const [viewLang, setViewLang] = useState(config.lang.languages[1].tag)

  const {myString, myStringI18n, myRichText, myRef} = value
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        myRichText: isFunctionalUpdate(richText) ? richText(value.myRichText) : richText
      })),
    [onChange]
  )

  const languages = config.lang.languages.map(v => {
    return {
      label: v.tag,
      value: v.tag
    }
  })
  const header = useMemo(() => {
    return (
      <Row className="show-grid">
        <Col xs={11}>
          <SelectPicker
            data={languages}
            value={editLang}
            appearance="subtle"
            onChange={setEditLang}
            style={{width: 100}}
          />
        </Col>
        <Col xs={2} style={{textAlign: 'center'}}>
          <Button
            appearance="link"
            onClick={() => {
              setEditLang(viewLang)
              setViewLang(editLang)
            }}>
            {<Icon icon="exchange" />}
          </Button>
        </Col>
        <Col xs={11} style={{textAlign: 'right'}}>
          <SelectPicker
            data={languages}
            value={viewLang}
            appearance="subtle"
            onChange={setViewLang}
            style={{width: 100}}
          />
        </Col>
      </Row>
    )
  }, [viewLang, editLang])

  return (
    <>
      <Grid>
        {header}
        <Panel bordered>
          <I18nWrapper value={myString}>
            <ControlLabel>myString</ControlLabel>
            <FormControl value={myString} onChange={myString => onChange?.({...value, myString})} />
          </I18nWrapper>

          <I18nWrapper value={myStringI18n[editLang]} display={myStringI18n[viewLang]}>
            <ControlLabel>myStringI18n</ControlLabel>
            <FormControl
              value={myStringI18n[editLang]}
              onChange={val =>
                onChange?.({...value, myStringI18n: {...myStringI18n, [editLang]: val}})
              }
            />
          </I18nWrapper>

          <I18nWrapper>
            <ControlLabel>myRichText</ControlLabel>
            <Panel bordered>
              <RichTextBlock
                value={myRichText}
                onChange={handleRichTextChange}
                config={{
                  bold: true,
                  italic: true,
                  url: true,
                  ref: {
                    modelA: {scope: ContentContextEnum.Local},
                    modelB: {scope: ContentContextEnum.Local},
                    [MediaReferenceType]: {scope: ContentContextEnum.Local}
                  }
                }}
              />
            </Panel>
          </I18nWrapper>

          <I18nWrapper>
            <ControlLabel>myRef</ControlLabel>
            <ReferenceButton
              reference={myRef}
              onClick={() => setChooseModalOpen(true)}
              onClose={() => {
                onChange?.({...value, myRef: null})
              }}></ReferenceButton>
          </I18nWrapper>
        </Panel>
      </Grid>

      <Modal show={isChooseModalOpen} size="lg" onHide={() => setChooseModalOpen(false)}>
        <RefSelectModal
          config={{
            modelA: {scope: ContentContextEnum.Local},
            modelB: {scope: ContentContextEnum.Local},
            [MediaReferenceType]: {scope: ContentContextEnum.Local}
          }}
          onClose={() => setChooseModalOpen(false)}
          onSelectRef={ref => {
            setChooseModalOpen(false)
            onChange?.({...value, myRef: ref})
          }}
        />
      </Modal>
    </>
  )
}
