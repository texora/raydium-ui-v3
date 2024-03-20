import { ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Collapse,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Image,
  SimpleGrid,
  StyleProps,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import { Wallet } from '@solana/wallet-adapter-react'

import CircleError from '@/icons/misc/CircleError'
import CircleSuccess from '@/icons/misc/CircleSuccess'
import { colors } from '@/theme/cssVariables'
import { toUTC } from '@/utils/date'
import toUsdVolume from '@/utils/numberish/toUsdVolume'
import SolanaNetworkIcon from '@/icons/networks/SolanaNetworkIcon'
import EthereumNetworkIcon from '@/icons/networks/EthereumNetworkIcon'
import BinanceNetworkIcon from '@/icons/networks/BinanceNetworkIcon'
import PolygonNetworkIcon from '@/icons/networks/PolygonNetworkIcon'
import ChevronLeftIcon from '@/icons/misc/ChevronLeftIcon'
import ChevronRightIcon from '@/icons/misc/ChevronRightIcon'
import { useAppStore } from '@/store'

import ChevronUpDownArrow from './ChevronUpDownArrow'
import AddressChip from './AddressChip'
import TokenAvatar from './TokenAvatar'

import { getTxAllRecord } from '@/utils/tx/historyTxStatus'
import dayjs from 'dayjs'

interface WalletMenuProps {
  wallet: Wallet | null
  address: string
  onDisconnect: () => void
  menuSX?: StyleProps
  isOpen?: boolean
  onClose: () => void
}
type RecentTransaction = {
  name: string
  txId: string
  status: 'success' | 'error'
  description: string
  date: number | Date | string // (ms)
  relatedTokens: { address: string; logoURI: string; symbol: string }[]
  sub?: {
    txId?: string
    name: string
    status: 'success' | 'error'
    date: number | Date | string // (ms)
  }[]
}

type WalletInfo = {
  adaptarName: string | undefined
  adaptarIcon?: string
  network: string
  networkIcon?: string | ReactNode
  address: string
  balanceUSD?: number
}

function getNetworkIcon(network: string): ReactNode | undefined {
  switch (network) {
    case 'Solana':
      return <SolanaNetworkIcon width="unset" height="unset" />
    case 'Ethereum':
      return <EthereumNetworkIcon width="unset" height="unset" />
    case 'Binance':
      return <BinanceNetworkIcon width="unset" height="unset" />
    case 'Polgon':
      return <PolygonNetworkIcon width="unset" height="unset" />
  }
}

export default function WalletRecentTransactionBoard({ wallet, address, isOpen = false, onClose, onDisconnect, menuSX }: WalletMenuProps) {
  const { t } = useTranslation()
  const allRecords = getTxAllRecord()

  const handleDisConnect = useCallback(() => {
    onDisconnect()
    onClose()
  }, [onClose, onDisconnect])

  const { isOpen: isRecentTransactionDetailView, onOpen: turnOn, onClose: turnOff } = useDisclosure()

  const solanaWalletInfo: WalletInfo | undefined = {
    adaptarName: wallet?.adapter.name,
    adaptarIcon: wallet?.adapter.icon,
    network: 'Solana',
    networkIcon: getNetworkIcon('Solana'),
    address,
    balanceUSD: 582.67
  }
  const evmWalletInfo: WalletInfo | undefined = {
    adaptarName: 'Metamask',
    adaptarIcon: 'https://avatars.githubusercontent.com/u/11744586?s=200&v=4',
    network: 'Ethereum',
    networkIcon: getNetworkIcon('Ethereum'),
    address: '0x5A653077FB46D9652919d818c992Bc9fde52f21F',
    balanceUSD: 1234.23
  }

  const recentTransactions: RecentTransaction[] = address
    ? allRecords
        .filter((r) => r.owner && r.owner === address)
        .map((record) => ({
          txId: record.txId,
          name: (record.isMultiSig ? `(${t('transaction.multisig_wallet')}) ` : '') + t(record.title, record.txValues || {}),
          status: record.status,
          description: t(record.description, record.txValues || {}).replaceAll(/(<([^>]+)>)/gi, ''),
          date: record.time,
          relatedTokens: record.mintInfo || [],
          sub: record.subTx
        }))
    : []

  const normalDrawerBody = (
    <Box>
      {/* Avatar */}
      {solanaWalletInfo && (
        <VStack py={1.5}>
          <Box flex="none" position="relative">
            <Image src={solanaWalletInfo.adaptarIcon} rounded="full" overflow="hidden" width={'40px'} height={'40px'} />
            <Box position={'absolute'} bottom={'-1px'} right={'-1px'} width={4} height={4}>
              {typeof solanaWalletInfo.networkIcon === 'string' ? (
                <Image src={solanaWalletInfo.networkIcon} width="100%" height="100%" />
              ) : (
                solanaWalletInfo.networkIcon
              )}
            </Box>
          </Box>
          <AddressChip
            textProps={{
              fontWeight: 500
            }}
            address={solanaWalletInfo.address}
            canCopy
            showCopyIcon
          />
          <Text fontSize="sm" color={colors.textTertiary}>
            {toUsdVolume(solanaWalletInfo.balanceUSD)}
          </Text>
        </VStack>
      )}

      {/* Anathor wallet */}
      {/* {evmWalletInfo && (
        <Box>
          <HStack fontWeight={500} my={3} fontSize="xs" justify="space-between" color={colors.textSecondary}>
            <Text>{t('recent_transaction.another_wallet')}</Text>
          </HStack>
          <AnotherWalletCard wallet={evmWalletInfo} />
        </Box>
      )} */}

      {/* divider */}
      <Box height="1px" color={colors.textTertiary} bg={colors.dividerDashGradient} my={4} />

      {/* Recent Transaction Cards */}
      <Box>
        <HStack fontWeight={500} my={3} fontSize="xs" justify="space-between" color={colors.textSecondary}>
          <Text>{t('recent_transaction.recent_transactions')}</Text>
          <HStack spacing={0.5} cursor="pointer" onClick={turnOn}>
            <Text>{t('recent_transaction.view_all')}</Text> <ChevronRightIcon width={'14px'} height={'14px'} />
          </HStack>
        </HStack>
        <VStack spacing={3} align="stretch">
          {recentTransactions.slice(0, 2).map((transaction) => (
            <RecentTransactionCard key={String(transaction.date)} transaction={transaction} />
          ))}
        </VStack>
      </Box>
    </Box>
  )

  const recentTransactionDetailView = (
    <Box>
      <HStack fontWeight={500} py={2} justify="space-between" color={colors.textSecondary}>
        <HStack spacing={0.5} cursor="pointer" onClick={turnOff}>
          <ChevronLeftIcon /> <Text>{t('common.back')}</Text>
        </HStack>
      </HStack>
      <VStack spacing={3} align="stretch">
        {recentTransactions.map((transaction) => (
          <RecentTransactionCard key={String(transaction.date)} transaction={transaction}></RecentTransactionCard>
        ))}
      </VStack>
    </Box>
  )

  return (
    <Drawer variant="flatScreenEdgePanel" size="sm" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        {/* hidden transaction */}
        <DrawerHeader display="none">{t('recent_transaction.recent_transactions')}</DrawerHeader>
        <DrawerBody>{isRecentTransactionDetailView ? recentTransactionDetailView : normalDrawerBody}</DrawerBody>
        <DrawerFooter onClick={handleDisConnect} cursor="pointer">
          {t('wallet_connect_panel.disconnect')}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function AnotherWalletCard({ wallet }: { wallet: WalletInfo }) {
  return (
    <Box bg={colors.backgroundDark} rounded="lg" p={3}>
      <HStack spacing={'10px'}>
        <Box flex="none" position="relative">
          <Image src={wallet.adaptarIcon} rounded="full" overflow="hidden" width={['28px', '32px']} height={['28px', '32px']} />
          <Box position={'absolute'} bottom={'-1px'} right={'-1px'} width={4} height={4}>
            {typeof wallet.networkIcon === 'string' ? <Image src={wallet.networkIcon} width="100%" height="100%" /> : wallet.networkIcon}
          </Box>
        </Box>
        <AddressChip
          textProps={{
            fontSize: 'sm'
          }}
          address={wallet.address}
          showCopyIcon={false}
        />
        <Text ml="auto" fontSize="sm" color={colors.textTertiary}>
          {toUsdVolume(wallet.balanceUSD)}
        </Text>
      </HStack>
    </Box>
  )
}

function RecentTransactionCard({ transaction }: { transaction: RecentTransaction }) {
  const { isOpen, onToggle } = useDisclosure()
  const explorerUrl = useAppStore((s) => s.explorerUrl)
  const { t } = useTranslation()

  return (
    <Box bg={colors.backgroundDark} rounded="lg" p={3}>
      <SimpleGrid
        gridTemplate={`
          "statu name token" auto
          ".     des  des  " auto
          ".     sub  sub  " auto 
          ".     date date " auto / auto 1fr auto
        `}
        columnGap="10px"
      >
        <Box gridArea="statu" alignSelf={'center'}>
          {transaction.status === 'success' ? <CircleSuccess /> : <CircleError />}
        </Box>
        <Box
          gridArea={'name'}
          cursor={transaction.txId ? 'pointer' : ''}
          onClick={transaction.txId ? () => window.open(`${explorerUrl}/tx/${transaction.txId}`) : undefined}
          fontSize="sm"
          fontWeight={500}
          color={colors.textPrimary}
        >
          {transaction.name}
        </Box>
        <Flex gridArea={'token'} alignSelf={'center'}>
          {transaction.relatedTokens.map((token) => (
            <TokenAvatar key={token.address} token={{ ...token, decimals: 0 }} size="sm" />
          ))}
        </Flex>
        <Box gridArea={'des'} fontSize="xs" pt={1.5} color={colors.textSecondary}>
          {transaction.description}
        </Box>
        <Box gridArea={'date'} fontSize="xs" pt={2} color={colors.textTertiary}>
          {dayjs(transaction.date).utc().format('M/D/YY HH:mm UTC')}
        </Box>
        {transaction.sub?.length && (
          <Box gridArea={'sub'} alignSelf={'center'}>
            <Collapse in={isOpen} animateOpacity>
              <Box pt={2}>
                {transaction.sub.map((subTransaction, idx) => (
                  <SimpleGrid
                    key={String(idx)}
                    gridTemplate={`
                      "statu name name" auto
                      ".     date date" auto / auto 1fr 
                    `}
                    columnGap="10px"
                  >
                    <Box gridArea="statu" alignSelf="center">
                      {subTransaction.status === 'success' ? (
                        <CircleSuccess width="14px" height="14px" />
                      ) : (
                        <CircleError width="14px" height="14px" />
                      )}
                    </Box>
                    <Box
                      gridArea={'name'}
                      cursor={subTransaction.txId ? 'pointer' : ''}
                      onClick={subTransaction.txId ? () => window.open(`${explorerUrl}/tx/${subTransaction.txId}`) : undefined}
                      fontSize="xs"
                      color={colors.textSecondary}
                    >
                      {t(subTransaction.name) || `${t('transaction.title')} ${idx + 1}`}
                    </Box>
                    <Box gridArea={'date'} fontSize="xs" color={colors.textTertiary}>
                      {toUTC(new Date(subTransaction.date))}
                    </Box>
                  </SimpleGrid>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </SimpleGrid>
      {transaction.sub && (
        <Box onClick={onToggle} cursor="pointer" mb={-1}>
          <ChevronUpDownArrow isOpen={isOpen} mx="auto" width="18px" height="18px" color={colors.textTertiary} />
        </Box>
      )}
    </Box>
  )
}