import { numberRegExp } from '@/utils/numberish/regex'
import { Flex, InputGroup, NumberInput, NumberInputField, NumberInputProps, SystemStyleObject, Text } from '@chakra-ui/react'
import React, { MouseEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import Decimal from 'decimal.js'

interface Props {
  id?: string
  name?: string
  title?: ReactNode
  readonly?: boolean
  disabled?: boolean
  loading?: boolean
  value: string
  side?: string
  balance?: string
  decimals?: number
  ctrSx?: SystemStyleObject
  inputSx?: SystemStyleObject
  inputGroupSx?: SystemStyleObject
  prefix?: ReactNode
  postfix?: ReactNode
  postFixInField?: boolean
  rightAddOn?: ReactNode
  placeholder?: string
  width?: string
  height?: string
  variant?: string
  min?: number
  max?: number
  onClick?: (e: MouseEvent<HTMLInputElement>) => void
  onChange?: (val: string, valNumber: number, side?: string) => void
  onFormikChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (val: string, side?: string) => void
  onFocus?: (side?: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

function DecimalInput(props: Props) {
  const {
    id,
    name,
    title,
    width = '100%',
    height,
    onChange,
    onFormikChange,
    onBlur,
    onFocus,
    onClick,
    onKeyDown,
    ctrSx = {},
    inputSx = {},
    inputGroupSx = {},
    prefix,
    postfix,
    decimals,
    side,
    readonly,
    disabled,
    value,
    min,
    max,
    placeholder,
    variant = 'filled',
    postFixInField = false,
    rightAddOn
  } = props
  const valRef = useRef(value)
  valRef.current = value
  const handleValidate = useCallback((value: string) => {
    return numberRegExp.test(value)
  }, [])

  const handleChange = useCallback(
    (val: string, valNumber: number) => {
      valRef.current = val
      const n = Number(shakeValueDecimal(valNumber, decimals))
      onChange?.(val, n, side)
    },
    [onChange, side, decimals]
  )

  const handleBlur = useCallback(() => {
    setTimeout(() => onBlur?.(valRef.current, side), 0)
  }, [onBlur, side])

  const handleParseVal = useCallback(
    (val: string) => {
      const splitArr = (val || '').split('.')
      if (splitArr.length > 2) return [splitArr[0], splitArr[1]].join('.')
      if (typeof decimals === 'number' && decimals > -1 && splitArr[1] && splitArr[1].length > decimals) {
        //.replace(/([1-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
        return [splitArr[0], splitArr[1].substring(0, decimals)].join('.')
      }
      return val === '.' ? '0.' : val
    },
    [decimals]
  )

  const handleFocus = useCallback(() => {
    onFocus?.(side)
  }, [onFocus, side])

  useEffect(() => {
    // parse first time
    const val = handleParseVal(valRef.current)
    handleChange(val, Number(val))
  }, [handleParseVal, handleChange])

  const shakeValueDecimal = (value: number | string | undefined, decimals?: number) =>
    value && !String(value).endsWith('.') && decimals != null && new Decimal(value).decimalPlaces() > decimals
      ? new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_FLOOR).toString()
      : value

  // // shaked decimal
  const showedValue = useMemo(() => shakeValueDecimal(value, decimals), [value, decimals])
  return (
    <Flex flexDirection="column" width={width} opacity={disabled ? '0.5' : '1'} sx={ctrSx}>
      {title ? (
        <Text mb="6px" minW="40px">
          {title}
        </Text>
      ) : null}
      <Flex alignItems="center" w="100%">
        {prefix}
        <InputGroup sx={{ width, height, px: 2, ...inputGroupSx }}>
          <NumberInput
            focusInputOnChange={false}
            id={id}
            name={name}
            min={min}
            max={max}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
            parse={handleParseVal}
            isReadOnly={readonly}
            isDisabled={disabled || false}
            value={showedValue} //FIXME: why still uncontrolled🤔?
            // precision={decimals}
            width={width}
            variant={variant}
            isValidCharacter={handleValidate}
          >
            <NumberInputField
              px={'0px'}
              sx={inputSx}
              id={id}
              name={name}
              placeholder={placeholder}
              width={width}
              height={height}
              onClick={onClick}
              onChange={onFormikChange}
              onKeyDown={onKeyDown}
            />
          </NumberInput>
          {postfix && postFixInField ? postfix : null}
        </InputGroup>
        {postFixInField ? (
          rightAddOn
        ) : (
          <>
            {postfix}
            {rightAddOn}
          </>
        )}
      </Flex>
    </Flex>
  )
}

export default DecimalInput