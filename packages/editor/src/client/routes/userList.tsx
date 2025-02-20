import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete, MdPassword, MdSearch} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Button, FlexboxGrid, IconButton, Input, InputGroup, Modal, Pagination, Table} from 'rsuite'

import {FullUserFragment, useDeleteUserMutation, UserSort, useUserListQuery} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {ResetUserPasswordForm} from '../atoms/user/resetUserPasswordForm'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../utility'

const {Column, HeaderCell, Cell} = Table

function mapColumFieldToGraphQLField(columnField: string): UserSort | null {
  switch (columnField) {
    case 'createdAt':
      return UserSort.CreatedAt
    case 'modifiedAt':
      return UserSort.ModifiedAt
    case 'name':
      return UserSort.Name
    case 'firstName':
      return UserSort.FirstName
    default:
      return null
  }
}

function UserList() {
  const [filter, setFilter] = useState('')

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false)
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<FullUserFragment>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [users, setUsers] = useState<FullUserFragment[]>([])

  const {data, refetch, loading: isLoading} = useUserListQuery({
    variables: {
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    })
  }, [filter, page, limit, sortOrder, sortField])

  const [deleteUser, {loading: isDeleting}] = useDeleteUserMutation()

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.users?.nodes) {
      setUsers(data.users.nodes)
      if (data.users.totalCount + 9 < page * limit) {
        setPage(1)
      }
    }
  }, [data?.users])

  /**
   * UI helpers
   */
  function getSubscriptionCellView(user: FullUserFragment) {
    const subscriptions = user.subscriptions
    const totalSubscriptions = subscriptions?.length
    // one subscription
    if (subscriptions?.length === 1) {
      return <>{t('userList.overview.oneSubscription')}</>
    }
    // multiple subscriptions
    if (subscriptions?.length) {
      return <>{t('userList.overview.amountOfSubscriptions', {amount: totalSubscriptions})}</>
    }
    // no subscription
    return <>{t('userList.overview.noSubscriptions')}</>
  }

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('userList.overview.users')}</h2>
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_USER']}>
          <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
            <Link to="/users/create">
              <IconButton appearance="primary" disabled={isLoading} icon={<MdAdd />}>
                {t('userList.overview.newUser')}
              </IconButton>
            </Link>
          </FlexboxGrid.Item>
        </PermissionControl>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          minHeight={600}
          autoHeight
          style={{flex: 1}}
          loading={isLoading}
          data={users}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType!)
            setSortField(sortColumn)
          }}>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.createdAt')}</HeaderCell>
            <Cell dataKey="createdAt">
              {({createdAt}: FullUserFragment) =>
                t('userList.overview.createdAtDate', {createdAtDate: new Date(createdAt)})
              }
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.modifiedAt')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: FullUserFragment) =>
                t('userList.overview.modifiedAtDate', {modifiedAtDate: new Date(modifiedAt)})
              }
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.firstName')}</HeaderCell>
            <Cell dataKey={'firstName'}>
              {(rowData: FullUserFragment) => (
                <Link to={`/users/edit/${rowData.id}`}>{rowData.firstName || ''}</Link>
              )}
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.name')}</HeaderCell>
            <Cell dataKey={'name'}>
              {(rowData: FullUserFragment) => (
                <Link to={`/users/edit/${rowData.id}`}>
                  {rowData.name || t('userList.overview.unknown')}
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('email')}</HeaderCell>
            <Cell dataKey="email" />
          </Column>
          {/* subscription */}
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('userList.overview.subscriptions')}</HeaderCell>
            <Cell>
              {(rowData: FullUserFragment) => <div>{getSubscriptionCellView(rowData)}</div>}
            </Cell>
          </Column>
          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: FullUserFragment) => (
                <>
                  <PermissionControl qualifyingPermissions={['CAN_RESET_USER_PASSWORD']}>
                    <IconButtonTooltip caption={t('userList.overview.resetPassword')}>
                      <IconButton
                        icon={<MdPassword />}
                        circle
                        size="sm"
                        style={{marginLeft: '5px'}}
                        onClick={e => {
                          setCurrentUser(rowData)
                          setIsResetUserPasswordOpen(true)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl qualifyingPermissions={['CAN_DELETE_USER']}>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        icon={<MdDelete />}
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        style={{marginLeft: '5px'}}
                        onClick={() => {
                          setConfirmationDialogOpen(true)
                          setCurrentUser(rowData)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.users.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>

      {/* reset user password */}
      {currentUser?.id && (
        <Modal open={isResetUserPasswordOpen} onClose={() => setIsResetUserPasswordOpen(false)}>
          <Modal.Header>
            <Modal.Title>{t('userCreateOrEditView.resetPassword')}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <ResetUserPasswordForm
              userID={currentUser?.id}
              userName={currentUser?.name}
              onClose={() => setIsResetUserPasswordOpen(false)}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={() => setIsResetUserPasswordOpen(false)} appearance="subtle">
              {t('userCreateOrEditView.cancel')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* delete user modal */}
      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userCreateOrEditView.deleteUser')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('userCreateOrEditView.name')}>
              {currentUser?.name || t('userCreateOrEditView.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentUser) return

              await deleteUser({
                variables: {id: currentUser.id}
              })

              setConfirmationDialogOpen(false)
              refetch()
            }}
            color="red">
            {t('userCreateOrEditView.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('userCreateOrEditView.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_USERS',
  'CAN_GET_USER',
  'CAN_CREATE_USER',
  'CAN_DELETE_USER',
  'CAN_RESET_USER_PASSWORD'
])(UserList)
export {CheckedPermissionComponent as UserList}
