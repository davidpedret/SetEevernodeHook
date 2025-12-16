import { Client, Wallet, SetHookFlags } from '@transia/xrpl'
import {
  createHookPayload,
  setHooksV3,
  SetHookParams,
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '@transia/hooks-toolkit'
import { xrpAddressToHex } from '@transia/hooks-toolkit/dist/npm/src/libs/binary-models'

import * as readline from 'readline'

const askQuestion = (rl: readline.Interface, prompt: string) => {
  return new Promise<string>((resolve) => rl.question(prompt, resolve))
}

export async function main(): Promise<void> {
  const serverUrl = 'wss://xahau.network'
  const client = new Client(serverUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    await client.connect()
    client.networkID = await client.getNetworkID()

    const destinationAccount = await askQuestion(
      rl,
      'Please input your Desired destination account to forward EVR to:',
    )

    let destinationID
    try {
      destinationID = xrpAddressToHex(destinationAccount)
    } catch (error) {
      console.error(
        'Cant decode Account ID from given destination rAddress, please make sure to use proper destination address',
        error,
      )
      return
    }
    console.log('Destination Account to send EVR to:' + destinationAccount)

    const seed = await askQuestion(rl, 'Please input your Host secret[seed]:')

    const consent = await askQuestion(
      rl,
      `Are you sure you want to install the hook using the seed [${seed}]  [yes/N]?`,
    )

    if (consent.toLowerCase() !== 'yes') {
      console.log('BA BYE')
      return
    }

    const myWallet = Wallet.fromSeed(seed)

    console.log('Creating hook payload...')

    const hookparam = new iHookParamEntry(new iHookParamName('A'), new iHookParamValue(destinationID, true))
    const hookPayload = createHookPayload({
      version: 0,
      createFile: 'redirect',
      namespace: 'redirect',
      flags: SetHookFlags.hsfOverride,
      hookOnArray: ['Payment'],
      hookParams: [hookparam.toXrpl()],
    })

    console.log('Generated hook payload:', hookPayload)

    try {
      console.log('Setting hook...')
      await setHooksV3({
        client: client,
        seed: myWallet.seed,
        hooks: [{ Hook: hookPayload }],
      } as SetHookParams)
      console.log('Hook set successfully.')
    } catch (error) {
      console.error('Error setting hook:', error)
    }
  } catch (error) {
    console.error('Error occurred:', error)
  } finally {
    rl.close()
    await client.disconnect()
    console.log('Disconnected from server.')
  }
}

main()
