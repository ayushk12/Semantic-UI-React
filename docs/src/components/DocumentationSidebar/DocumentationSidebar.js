import keyboardKey from 'keyboard-key'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Link, withRouter } from 'react-static'
import { Menu, Icon, Input, Ref } from 'semantic-ui-react'
import EventStack from '@semantic-ui-react/event-stack'

import CarbonAd from 'docs/src/components/CarbonAd/CarbonAd'
import { withData } from 'docs/src/components/DocumentationDataProvider'
import Logo from 'docs/src/components/Logo/Logo'
import { compose } from 'docs/src/hoc'
import shallowEqual from 'src/lib/shallowEqual'
import { docTypes, getComponentPathname, typeOrder, repoURL } from 'docs/src/utils'

const selectedItemLabelStyle = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  padding: '4px 0.5rem',
  margin: '2px',
  color: '#8ff',
  background: '#222',
}
const SelectedItemLabel = ({ showArrows }) => (
  <span style={selectedItemLabelStyle}>
    {showArrows && <Icon name='exchange' rotated='clockwise' />}
    {showArrows && 'or '}
    Enter
  </span>
)
SelectedItemLabel.propTypes = {
  showArrows: PropTypes.bool,
}

class DocumentationSidebar extends Component {
  static propTypes = {
    componentMenu: docTypes.componentMenu.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    style: PropTypes.object,
    version: PropTypes.string.isRequired,
  }

  state = { query: '' }

  constructor(props) {
    super(props)

    this.filteredMenu = props.componentMenu
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(this.state, nextState)
  }

  handleDocumentKeyDown = (e) => {
    const isSlash = keyboardKey.getKey(e) === '/'
    const hasModifier = e.altKey || e.ctrlKey || e.metaKey
    const bodyHasFocus = document.activeElement === document.body

    if (!hasModifier && isSlash && bodyHasFocus) this._searchInput.focus()
  }

  handleItemClick = () => {
    const { query } = this.state

    if (query) this.setState({ query: '' })
    if (document.activeElement === this._searchInput) this._searchInput.blur()
  }

  handleSearchChange = (e) => {
    // ignore first "/" on search focus
    if (e.target.value === '/') return

    this.setState({
      selectedItemIndex: 0,
      query: e.target.value,
    })
  }

  handleSearchKeyDown = (e) => {
    const { history } = this.props
    const { selectedItemIndex } = this.state
    const code = keyboardKey.getCode(e)

    if (code === keyboardKey.Enter && this.selectedRoute) {
      e.preventDefault()
      history.push(this.selectedRoute)
      this.selectedRoute = null
      this.setState({ query: '' })
    }

    if (code === keyboardKey.ArrowDown) {
      e.preventDefault()
      const next = _.min([selectedItemIndex + 1, this.filteredMenu.length - 1])
      this.selectedRoute = getComponentPathname(this.filteredMenu[next])
      this.setState({ selectedItemIndex: next })
    }

    if (code === keyboardKey.ArrowUp) {
      e.preventDefault()
      const next = _.max([selectedItemIndex - 1, 0])
      this.selectedRoute = getComponentPathname(this.filteredMenu[next])
      this.setState({ selectedItemIndex: next })
    }
  }

  handleSearchRef = (c) => {
    this._searchInput = c && c.querySelector('input')
  }

  menuItemsByType = _.map((nextType) => {
    const items = _.flow(
      _.filter(({ type }) => type === nextType),
      _.map(info => (
        <Menu.Item
          key={info.displayName}
          name={info.displayName}
          onClick={this.handleItemClick}
          as={Link}
          to={getComponentPathname(info)}
          activeClassName='active'
        />
      )),
    )(this.props.componentMenu)

    return (
      <Menu.Item key={nextType}>
        <Menu.Header>{_.capitalize(nextType)}s</Menu.Header>
        <Menu.Menu>{items}</Menu.Menu>
      </Menu.Item>
    )
  }, typeOrder)

  renderSearchItems = () => {
    const { selectedItemIndex, query } = this.state
    if (!query) return

    let itemIndex = -1
    const startsWithMatches = []
    const containsMatches = []
    const escapedQuery = _.escapeRegExp(query)

    _.each((info) => {
      if (new RegExp(`^${escapedQuery}`, 'i').test(info.displayName)) {
        startsWithMatches.push(info)
      } else if (new RegExp(escapedQuery, 'i').test(info.displayName)) {
        containsMatches.push(info)
      }
    }, this.props.componentMenu)

    this.filteredMenu = [...startsWithMatches, ...containsMatches]
    const hasMultipleMatches = this.filteredMenu.length > 1
    const menuItems = _.map((info) => {
      itemIndex += 1
      const isSelected = itemIndex === selectedItemIndex

      if (isSelected) this.selectedRoute = getComponentPathname(info)

      return (
        <Menu.Item
          key={info.displayName}
          name={info.displayName}
          onClick={this.handleItemClick}
          active={isSelected}
          as={Link}
          to={getComponentPathname(info)}
        >
          {info.displayName}
          {isSelected && <SelectedItemLabel showArrows={hasMultipleMatches} />}
        </Menu.Item>
      )
    }, this.filteredMenu)

    return <Menu.Menu>{menuItems}</Menu.Menu>
  }

  render() {
    const { style, version } = this.props
    const { query } = this.state

    return (
      <div style={style}>
        <Menu
          fluid
          inverted
          vertical
          borderless
          compact
          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          <Menu.Item>
            <Logo spaced='right' size='mini' />
            <strong>
              Semantic UI React &nbsp;
              <small>
                <em>{version}</em>
              </small>
            </strong>
          </Menu.Item>
          <Menu.Item style={{ boxShadow: '0 0 1rem black' }}>
            <Menu.Header>Getting Started</Menu.Header>
            <Menu.Menu>
              <Menu.Item as={Link} exact to='/' activeClassName='active'>
                Introduction
              </Menu.Item>
              <Menu.Item as={Link} exact to='/usage' activeClassName='active'>
                Usage
              </Menu.Item>
              <Menu.Item as={Link} exact to='/theming' activeClassName='active'>
                Theming
              </Menu.Item>
              <Menu.Item as={Link} exact to='/layouts' activeClassName='active'>
                Layouts
              </Menu.Item>
              <Menu.Item as='a' href={repoURL} target='_blank' rel='noopener noreferrer'>
                <Icon name='github' /> GitHub
              </Menu.Item>
              <Menu.Item
                as='a'
                href={`${repoURL}/blob/master/CHANGELOG.md`}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Icon name='file alternate outline' /> CHANGELOG
              </Menu.Item>
            </Menu.Menu>
          </Menu.Item>
          <div style={{ flex: 1, overflowY: 'scroll' }}>
            <Menu.Item fitted>
              <Ref innerRef={this.handleSearchRef}>
                <Input
                  fluid
                  icon={{ name: 'filter', color: 'teal', inverted: true, bordered: true }}
                  placeholder='Press &quot;/&quot; to find a component'
                  value={query}
                  onChange={this.handleSearchChange}
                  onKeyDown={this.handleSearchKeyDown}
                />
              </Ref>
            </Menu.Item>
            {query ? this.renderSearchItems() : this.menuItemsByType}
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <CarbonAd />
          </div>
        </Menu>

        <EventStack name='keydown' on={this.handleDocumentKeyDown} />
      </div>
    )
  }
}

export default compose(
  withData,
  withRouter,
)(DocumentationSidebar)