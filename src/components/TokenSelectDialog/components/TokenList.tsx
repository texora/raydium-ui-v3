import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { TokenInfo } from '@raydium-io/raydium-sdk-v2'
import { useTranslation } from 'react-i18next'
import { PublicKey } from '@solana/web3.js'
import { useEvent } from '@/hooks/useEvent'
import SearchIcon from '@/icons/misc/SearchIcon'
import AddTokenIcon from '@/icons/misc/AddTokenIcon'
import RemoveTokenIcon from '@/icons/misc/RemoveTokenIcon'
import { useTokenAccountStore, useTokenStore, setTokenToStorage, unsetTokenToStorage } from '@/store'
import { colors } from '@/theme/cssVariables'
import { sortItems } from '@/utils/sortItems'
import { filterTokenFn } from '@/utils/token'
import { Box, Divider, Flex, Heading, Input, InputGroup, InputRightAddon, SimpleGrid, Text } from '@chakra-ui/react'
import Decimal from 'decimal.js'
import PopularTokenCell from './PopularTokenCell'
import List from '@/components/List'
import AddressChip from '@/components/AddressChip'
import TokenAvatar from '@/components/TokenAvatar'
import Button from '@/components/Button'
import useTokenInfo from '@/hooks/token/useTokenInfo'
import { isValidPublicKey } from '@/utils/common'

const perPage = 30

const USDCMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const SOLMint = PublicKey.default.toString()
const RAYMint = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'
const USDTMint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

export default function TokenList({
  onOpenTokenList,
  isDialogOpen: isOpen,
  onChooseToken,
  filterFn
}: {
  onOpenTokenList: () => void
  isDialogOpen: boolean
  onChooseToken: (token: TokenInfo) => void
  filterFn?: (token: TokenInfo) => boolean
}) {
  const { t } = useTranslation()
  const orgTokenList = useTokenStore((s) => s.displayTokenList)
  const orgTokenMap = useTokenStore((s) => s.tokenMap)
  const setExtraTokenList = useTokenStore((s) => s.setExtraTokenList)
  const unsetExtraTokenList = useTokenStore((s) => s.unsetExtraTokenList)
  const [getTokenBalanceUiAmount, tokenAccountMap] = useTokenAccountStore((s) => [s.getTokenBalanceUiAmount, s.tokenAccountMap])
  const tokenList = useMemo(() => (filterFn ? orgTokenList.filter(filterFn) : orgTokenList), [filterFn, orgTokenList])
  const [filteredList, setFilteredList] = useState<TokenInfo[]>(tokenList)
  const [displayList, setDisplayList] = useState<TokenInfo[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setDisplayList(tokenList.slice(0, perPage))
  }, [tokenList])

  useEffect(() => {
    const compareFn = (_a: number, _b: number, items: { itemA: TokenInfo; itemB: TokenInfo }) => {
      const accountA = tokenAccountMap.get(items.itemA.address)
      const accountB = tokenAccountMap.get(items.itemB.address)
      return new Decimal(accountB?.[0].amount.toString() || Number.MIN_VALUE)
        .div(10 ** items.itemB.decimals)
        .sub(new Decimal(accountA?.[0].amount.toString() || Number.MIN_VALUE).div(10 ** items.itemA.decimals))
        .toNumber()
    }
    const sortedTokenList = sortItems(tokenList, {
      sortRules: [{ value: (i) => i.symbol === 'RAY' || i.symbol === 'SOL' }, { value: (i) => i.symbol.length, compareFn }]
    })
    const filteredList = search ? filterTokenFn(sortedTokenList, { searchStr: search }) : sortedTokenList

    setDisplayList(filteredList.slice(0, perPage))
    setFilteredList(filteredList)
  }, [search, tokenList, tokenAccountMap])

  const { tokenInfo: newToken } = useTokenInfo({
    mint: search && !filteredList.length && isValidPublicKey(search) ? search : undefined
  })

  useEffect(() => {
    if (!newToken) return
    setExtraTokenList({ token: newToken, addToStorage: newToken.type === 'raydium' || newToken.type === 'jupiter' })
  }, [newToken, setExtraTokenList])

  const showMoreData = useEvent(() => {
    setDisplayList((list) => list.concat(filteredList.slice(list.length, list.length + perPage)))
  })

  useEffect(() => {
    setSearch('')
  }, [isOpen])

  const handleSearchChange = useEvent((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  })

  const getBalance = useCallback((token: TokenInfo) => getTokenBalanceUiAmount({ mint: token.address }).text, [getTokenBalanceUiAmount])

  const handleAddUnknownTokenClick = useCallback((token: TokenInfo) => {
    setExtraTokenList({ token: { ...token, userAdded: true }, addToStorage: true, update: true })
  }, [])
  const handleRemoveUnknownTokenClick = useCallback((token: TokenInfo) => {
    unsetExtraTokenList(token)
  }, [])

  const USDC = useMemo(() => orgTokenMap.get(USDCMint), [orgTokenMap])
  const SOL = useMemo(() => orgTokenMap.get(SOLMint), [orgTokenMap])
  const RAY = useMemo(() => orgTokenMap.get(RAYMint), [orgTokenMap])
  const USDT = useMemo(() => orgTokenMap.get(USDTMint), [orgTokenMap])

  const [usdcDisabled, solDisabled, rayDisabled, usdtDisabled] = filterFn
    ? [!USDC || !filterFn(USDC), !SOL || !filterFn(SOL), !RAY || !filterFn(RAY), !USDT || !filterFn(USDT)]
    : [false, false, false, false]

  const renderTokenItem = useCallback(
    (token: TokenInfo) => (
      <TokenRowItem
        token={token}
        balance={() => getBalance(token)}
        onClick={(token) => onChooseToken(token)}
        onAddUnknownTokenClick={(token) => handleAddUnknownTokenClick(token)}
        onRemoveUnknownTokenClick={() => handleRemoveUnknownTokenClick(token)}
      />
    ),
    [getBalance]
  )
  return (
    <Flex direction="column" height="100%" mx="8px">
      <InputGroup bg={colors.backgroundDark} color={colors.textSecondary} rounded="8px">
        <Input
          p="8px 16px"
          variant="unstyled"
          _placeholder={{
            fontSize: '14px',
            color: colors.textTertiary
          }}
          placeholder={t('token_selector.search_placeholder') ?? undefined}
          onChange={handleSearchChange}
        />
        <InputRightAddon bg="transparent">
          <SearchIcon />
        </InputRightAddon>
      </InputGroup>

      <Box pb="8px">
        <Heading fontSize="xs" fontWeight={500} color={colors.textTertiary} py="12px">
          {t('common.popular_tokens')}
        </Heading>

        <SimpleGrid gridTemplateColumns={'repeat(auto-fill, minmax(80px, 1fr))'} gap={3}>
          <PopularTokenCell token={USDC} onClick={(token) => onChooseToken(token)} disabled={usdcDisabled} />
          <PopularTokenCell token={SOL} onClick={(token) => onChooseToken(token)} disabled={solDisabled} />
          <PopularTokenCell token={RAY} onClick={(token) => onChooseToken(token)} disabled={rayDisabled} />
          <PopularTokenCell token={USDT} onClick={(token) => onChooseToken(token)} disabled={usdtDisabled} />
        </SimpleGrid>
      </Box>

      <Divider my="10px" color={colors.backgroundTransparent12} />

      <Flex direction="column" flexGrow={1} css={{ contain: 'size' }}>
        <Flex justifyContent="space-between" py="10px">
          <Heading fontSize="xs" fontWeight={500} color={colors.textTertiary}>
            {t('common.token')}
          </Heading>
          <Heading fontSize="xs" fontWeight={500} color={colors.textTertiary}>
            {t('common.balance')}/{t('common.address')}
          </Heading>
        </Flex>
        <Box overflow="hidden" mx="-12px">
          <List height="100%" onLoadMore={showMoreData} preventResetOnChange items={displayList} getItemKey={(token) => token.name}>
            {renderTokenItem}
          </List>
        </Box>
      </Flex>
      <Box borderRadius={'8px'} background={colors.modalContainerBg} p="12px" mb="24px">
        <Text opacity={'50%'} fontWeight={'normal'} fontSize={'12px'} lineHeight={'16px'} color={colors.textSecondary}>
          {t('token_selector.token_not_found')}
        </Text>
      </Box>

      <Button variant="solid-dark" width="full" bg={colors.backgroundDark} onClick={() => onOpenTokenList()}>
        {t('common.view_token_list')}
      </Button>
    </Flex>
  )
}

function TokenRowItem({
  token,
  balance,
  onClick,
  onAddUnknownTokenClick,
  onRemoveUnknownTokenClick
}: {
  token: TokenInfo
  balance: () => string
  onClick: (token: TokenInfo) => void
  onAddUnknownTokenClick: (token: TokenInfo) => void
  onRemoveUnknownTokenClick: (token: TokenInfo) => void
}) {
  const { t } = useTranslation()
  const isUnknown = !token.type || token.type === 'unknown'
  const isTrusted = isUnknown && !!useTokenStore.getState().tokenMap.get(token.address)?.userAdded

  return (
    <Flex
      justifyContent={'space-between'}
      alignItems="center"
      _hover={{
        bg: colors.backgroundDark50
      }}
      rounded="md"
      py="12px"
      px="12px"
      maxW={'100%'}
      overflow={'hidden'}
      onClick={() => onClick?.(token)}
    >
      <Flex w="full" justifyContent={'space-between'}>
        <Flex w="0" flexGrow={1} minW="0">
          <TokenAvatar token={token} mr="2" />
          <Box w="100%" minW="0" overflow="hidden">
            <Box display="flex" gap={2} alignItems="center">
              <Text color={colors.textSecondary} mt="0.5">
                {token.symbol}
              </Text>
              {isUnknown ? (
                <Box
                  display="flex"
                  alignSelf="center"
                  alignItems="center"
                  cursor="pointer"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    !isTrusted ? onAddUnknownTokenClick?.(token) : onRemoveUnknownTokenClick?.(token)
                  }}
                >
                  {!isTrusted ? <AddTokenIcon /> : <RemoveTokenIcon />}
                  <Text fontSize={'sm'} lineHeight="16px" pl={1} fontWeight="medium" color={colors.textSeptenary}>
                    {!isTrusted ? t('common.add_token') : t('common.remove_token')}
                  </Text>
                </Box>
              ) : null}
            </Box>
            <Text color={colors.textTertiary} isTruncated fontSize="xs">
              {token.name}
            </Text>
          </Box>
        </Flex>
        <Box flexShrink={0}>
          <Box color={colors.textSecondary} textAlign="right">
            {balance()}
            <AddressChip
              onClick={(ev) => ev.stopPropagation()}
              color={colors.textTertiary}
              canExternalLink
              fontSize="xs"
              address={token.address}
            />
          </Box>
        </Box>
      </Flex>
      {/* <Grid
        gridTemplate={`
          "avatar symbol" auto
          "avatar name  " auto / auto 1fr
        `}
        columnGap={[1, 2]}
        alignItems="center"
        cursor="pointer"
      >
        <GridItem gridArea="avatar">
          <TokenAvatar token={token} />
        </GridItem>
        <GridItem gridArea="symbol">
          <Text color={colors.textSecondary}>{token.symbol}</Text>
        </GridItem>
        <GridItem gridArea="name">
          <Text
            color={colors.textTertiary}
            maxWidth={'90%'} // handle token is too long
            overflow={'hidden'}
            whiteSpace={'nowrap'}
            textOverflow={'ellipsis'}
            fontSize="xs"
          >
            {token.name}
          </Text>
        </GridItem>
      </Grid>

      <Grid
        gridTemplate={`
          "balance" auto
          "address" auto / auto 
        `}
        columnGap={[2, 4]}
        alignItems="center"
      >
        <GridItem gridArea="balance">
          <Text color={colors.textSecondary} textAlign="right">
            {balance()}
          </Text>
        </GridItem>
        <GridItem gridArea="address">
          <AddressChip
            onClick={(ev) => ev.stopPropagation()}
            color={colors.textTertiary}
            canExternalLink
            fontSize="xs"
            address={token.address}
          />
        </GridItem>
      </Grid> */}
    </Flex>
  )
}