import React from 'react'


import { Grid, Cell } from 'styled-css-grid'
import { INSTRUMENTS_THEME } from './theme'
//import { ReactComponent as ESPIcon} from './assets/esp.svg'
import OnyxLogo from './assets/onyx.svg'

import styled, { ThemeProvider } from 'styled-components';
import { useSignalDisplay, useSignalHotkeySimulation, useSignalState } from './contexts/SignalContext';
import { useStatusState } from './contexts/M2';
import { GridContextProvider } from './contexts/GridContext';

import BatteryGauge from './components/gauges/BatteryGauge'
import LaneKeepingGauge from './components/gauges/LaneKeepingGauge'
import TirePressureDisplay from './components/displays/TirePressureDisplay'
import AutopilotIndicator from './components/indicators/AutopilotIndicator'
import BreakingIndicator from './components/indicators/BrakingIndicator'
import LeftTurnIndicator from './components/indicators/LeftTurnIndicator'
import RightTurnIndicator from './components/indicators/RightTurnIndicator'
import GearIndicator from './components/indicators/GearIndicator';
import SpeedGauge from './components/gauges/SpeedGauge'
import PowerGauge from './components/gauges/PowerGauge';

// Trip meter could be "display" with clock (arrival time) and hourglass (time to dest)

// TODO LIST
// - Consumption sub value
// - Max speed / power subvalues with triangles (that reset to current speed after 10s)
// - Dynamic speed limits

// NICE TO HAVE
// - On/off with main screen (UI_displayOn 1/0)
// - Brightness sync
// - blindspot indicators

// BUGS
// - Coming off the accelerator, the power needle bounces before resetting to "normal" values
// - Vertical alignment of digital value is different on phone

// Battery indicator exmaple
// https://scotch.io/tutorials/build-a-real-battery-status-web-component-with-polymer

// Driving cluster
// Big left: speed, black when under speed limit, yellow when over but not in speeding ticket range, red when over a lot, limits 0 - 200?

// Use subvalues for speed limit and/or current throttle?
// Or recent max speed?
// https://js.devexpress.com/Demos/WidgetsGallery/Demo/Gauges/DifferentSubvalueIndicatorTypes/React/DarkViolet/

// custom tick intervals
// https://js.devexpress.com/Demos/WidgetsGallery/Demo/Gauges/ScaleCustomTickInterval/React/DarkViolet/
// https://js.devexpress.com/Demos/WidgetsGallery/Demo/Gauges/ScaleCustomTickValues/React/DarkViolet/

/* Excessive speeding law ---> RED!
40 km/h or more in a zone where the speed limit is 60 km/h or less
50 km/h or more in a zone where the speed limit is over 60 km/h and up to 90 km/h
60 km/h or more in a zone where the speed limit is 100 km/h or over
*/

// Big right: power, zero at 1/3, green on regen, red/black on discharge? limits dynamic based on data
// Use range container for red/green
// https://js.devexpress.com/Demos/WidgetsGallery/Demo/Gauges/CustomLayout/React/DarkViolet/

// Maybe have rings for pedal position and torque
// Linear bar under big gauges for lane keeping (black/yellow/red depending on distance)
// https://js.devexpress.com/Demos/WidgetsGallery/Demo/Gauges/DifferentValueIndicatorTypesLinearGauge/React/DarkViolet/

// small gauges for
// battery level + temp
// stator + inv temps
// trip consumption / time
// tpms

// hands on steering wheel indicator?
// break light on?
// hold on?
// gear selection

// lower middle widget
// 1. tire pressure / 4w
// 2. tire temps / 4w
// 3. brake temps / 4w
// 4. brake torque / 4w
// 5. g-force pad
// 6. steering? / angle + speed
// 7. oil flow + temp?
// 8. batt info / kwh - v - a - degC
// 9. PTC kW
// 10. trip meter?

/**
 * Component that displays ...
 * @component
 */
export default function ElectronicInstrumentCluster(props) {
  const theme = INSTRUMENTS_THEME
  //const displayOn = useSignalState('UI_displayOn', 0)
  const [ m2IsOnline ] = useStatusState({forceOnlineKey: 'pageup', forceOfflineKey: 'pagedown'})

  const odometer = useSignalState('DI_odometer', 0)

  const { value: gearValue, units: gearName } = useSignalDisplay('DI_gear', 0, '1')
  const gear = (gearValue > 0 && gearValue < 7) ? gearName : 'P'

  useSignalHotkeySimulation({

    // turn on the display
    'home': [
      ['UI_displayOn', 1],
      ['UI_usableSOC', 69]
    ],

    // set the car to "ready" state, (o)dometer on
    'o': [
      ['DI_odometer', 69420],
      ['DI_gear', 'P']
    ],

    // gear selection
    'p': [['DI_gear', 'P']],
    'r': [['DI_gear', 'R']],
    'n': [['DI_gear', 'N']],
    'd': [['DI_gear', 'D']],

    // hit the (b)rakes
    'b': [
      ['VCLEFT_brakeLightStatus', 'ON'],
      ['DI_uiSpeed', 0],
      ['DI_elecPower', -20]
    ],

    // hit the (a)ccelerator
    'a': [
      ['VCLEFT_brakeLightStatus', 0],
      ['DI_uiSpeed', 50],
      ['DI_elecPower', 20]
    ],

    'left': [
      ['VCLEFT_turnSignalStatus', 'ON']
    ],

    'right': [
      ['VCRIGHT_turnSignalStatus', 'ON']
    ]

  })

  const ready = odometer > 0
  const consumption = 140

  // this would/will be relevant with a permanent installation, not with a phone
  // you take with you
  // if (!displayOn) {
  //   return (
  //     <Display/>
  //   )
  // }

  if (!m2IsOnline) {
    return (
      <Display>
        <LogoDisplay />
      </Display>
    )
  }

  // const cabinTemp = useSignalState('VCFRONT_tempAmbientFiltered', 0)
  // const outsideTemp = useSignalState('', 0)
  // const batteryTemp = useSignalState('BMS_thermistorTMin', 0)
  // const inverterTemp = useSignalState('DI_inverterT', 0)
  // const statorTemp = useSignalState('DI_statorT', 0)

  // const esp = useSignalState('?', false)

  // NOTE: Grid is an awkward size (100% sure 786x393 is correct for Pixel 3, tested empirically)
  // I want 48px square grid cells to allow an indicator to be placed anywhere easily.
  // This will require a "spacer" row and column, which will be down the middle horizontally
  // and below both primary gauges vertically. Works out perfectly with a 1px accounting for 8px
  // gaps

  return (
    <ThemeProvider theme={theme}>
      <Display>
        <Grid rows='repeat(7, 48px)' columns='repeat(14, 48px)'>
          <GridContextProvider cellWidth={48} cellHeight={48} gapSize={8}>

            {/* Speed Gauge */}
            <Cell as={SpeedGauge} visible={ready} left={1} top={1} width={6} height={5} />

            {/* Top indicators */}
            <Cell as={LaneKeepingGauge} left={6} top={1} width={4} />
            <Cell as={LeftTurnIndicator} top={1} left={6} />
            <Cell as={RightTurnIndicator} top={1} left={9} />

            {/* Middle indicators */}
            <Cell as={AutopilotIndicator} top={2} left={7} width={2} />
            {/* { esp &&
              <Cell top={3} left={7} width={2} >
                <ESPIcon width="100%" height="100%" fill={theme.indicator.yellow} />
              </Cell>
            } */}
            <Cell as={BreakingIndicator} top={4} left={7} width={2} />
            <Cell as={GearIndicator} top={5} left={7} width={2} />

            {/* Power Gauge */}
            <Cell as={PowerGauge} visible={ready} left={9} top={1} width={6} height={5} />

            {/* Display divider */}
            <Cell style={{overflow: 'hidden'}} top={6} left={1} width={14} height={2}>
              <svg viewBox='0 0 200 100'>
                <path d='M 0 8 h 74 c 6 0, 6 -5, 12 -5 h 28 c 6 0, 6 5, 12 5 h 74' strokeWidth='0.5' stroke='white' fill='transparent'/>
              </svg>
            </Cell>

            {/* Data display */}
            {/* <Cell center middle top={7} left={2} width={4} height={1} style={{fontSize: '20px', color: theme.indicator.grey, marginTop: '-10px'}}>
              TIRE PRESSURE
            </Cell>
            <Cell as={TirePressureDisplay} top={6} left={6} width={4} height={2} /> */}

            <Cell as={BigValue} top={6} left={6} width={4} height={2}>{gear}</Cell>

            {/* Battery gauge */}
            <Cell as={BatteryGauge} left={11} top={6} width={4} height={2} />

          </GridContextProvider>
        </Grid>
      </Display>
    </ThemeProvider>
  );

}

const Display = styled.div`
  position: relative;
  top: 0;
  height: 393px; //100vh;
  width: 786px; // height * 2
  padding: 4px;
  overflow: hidden;
  background-color: black;
`


const BigValue = styled.div`
  //color: ${props => props.colour};
  margin-top: 50px;
  color: white;
  text-align: center;
  font-family: 'Gotham Extra Light';
  font-size: 84px;
  //top: 0;
`

const GaugeCLuster = styled.div`
  position: relative;
`

const LogoDisplay = styled.div`
  height: 393px; //100vh;
  width: 786px; // height * 2
  background-image: url(${OnyxLogo});
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`
