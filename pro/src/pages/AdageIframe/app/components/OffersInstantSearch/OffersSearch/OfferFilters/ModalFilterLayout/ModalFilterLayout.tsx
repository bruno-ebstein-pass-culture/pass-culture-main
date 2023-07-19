import React from 'react'

import fullClear from 'icons/full-clear.svg'
import Button from 'ui-kit/Button/Button'
import { ButtonVariant } from 'ui-kit/Button/types'

import styles from './ModalFilterLayout.module.scss'

interface ModalFilterLayoutProps extends React.HTMLProps<HTMLButtonElement> {
  title: string
  onClean?: () => void
  onSearch: () => void
}

const ModalFilterLayout = ({
  title,
  children,
  onClean,
  onSearch,
}: ModalFilterLayoutProps) => {
  return (
    <div className={styles['modal-content']}>
      <div className={styles['modal-content-title']}>{title}</div>
      <div className={styles['modal-content-children']}>{children}</div>
      <div className={styles['modal-content-separator']}></div>
      <div className={styles['modal-content-footer']}>
        <Button
          icon={fullClear}
          variant={ButtonVariant.TERNARY}
          onClick={onClean}
        >
          Effacer
        </Button>
        <Button
          variant={ButtonVariant.PRIMARY}
          className={styles['search-button']}
          onClick={onSearch}
          testId="search-button-modal"
        >
          Rechercher
        </Button>
      </div>
    </div>
  )
}

export default ModalFilterLayout
