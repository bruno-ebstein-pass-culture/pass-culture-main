import cn from 'classnames'
import React from 'react'

import FieldError from '../FieldError'

import styles from './FieldLayout.module.scss'

interface IFieldLayoutProps {
  children: React.ReactNode
  label: string
  name: string
  isLabelHidden?: boolean
  showError: boolean
  className?: string
  error?: string
  count?: number
  maxLength?: number
  isOptional?: boolean
  smallLabel?: boolean
  hideFooter?: boolean
  inline?: boolean
  classNameLabel?: string
  classNameFooter?: string
  width?: number
  spaceBetween?: boolean
}
/* istanbul ignore next: DEBT, TO FIX */
const FieldLayout = ({
  children,
  label,
  isLabelHidden = false,
  className,
  name,
  showError = false,
  error,
  count = undefined,
  maxLength = undefined,
  isOptional = false,
  smallLabel,
  hideFooter = false,
  inline = false,
  classNameLabel,
  classNameFooter,
  width,
  spaceBetween,
}: IFieldLayoutProps): JSX.Element => (
  <div
    className={cn(styles['field-layout'], className, {
      [styles['field-layout-small-label']]: smallLabel,
      [styles['field-layout-inline']]: inline,
      [styles['field-layout-space-between']]: spaceBetween,
    })}
    data-testid={`wrapper-${name}`}
  >
    <label
      className={cn(styles['field-layout-label'], classNameLabel, {
        [styles['label-hidden']]: isLabelHidden,
      })}
      htmlFor={name}
    >
      {label}
      {isOptional && (
        <span className={styles['field-layout-optional']}>Optionnel</span>
      )}
    </label>

    <div
      className={styles['field-layout-content']}
      style={width ? { width: `${width / 16}rem` } : {}}
    >
      <div>{children}</div>

      {!hideFooter && (
        <div className={cn(classNameFooter, styles['field-layout-footer'])}>
          {showError && !!error && (
            <div className={styles['field-layout-error']}>
              <FieldError name={name}>{error}</FieldError>
            </div>
          )}
          {count !== undefined && maxLength !== undefined && (
            <span
              className={styles['field-layout-counter']}
              data-testid={`counter-${name}`}
            >
              {count}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
)

export default FieldLayout
