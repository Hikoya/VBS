import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  FormLabel,
  FormControl,
  Input,
  List,
  ListItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Progress,
  SimpleGrid,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import LoadingModal from '@components/sys/misc/LoadingModal';
import SessionEditConfirmationModal from '@components/sys/cca/SessionEditConfirmationModal';
import MemberButton from '@components/sys/cca/MemberButton';

import { cardVariant, parentVariant } from '@root/motion';
import { InfoIcon } from '@chakra-ui/icons';
import { CCASession } from 'types/cca/ccaSession';
import { Result } from 'types/api';
import { CCARecord } from 'types/cca/ccaRecord';
import { CCAAttendance } from 'types/cca/ccaAttendance';

import { checkerString } from '@constants/sys/helper';
import { timeSlots } from '@constants/sys/timeslot';
import {
  convertDateToUnix,
  isValidDate,
  calculateDuration,
} from '@root/src/constants/sys/date';
import moment from 'moment';

const MotionSimpleGrid = motion(SimpleGrid);
const MotionBox = motion(Box);

const levels = {
  TIME: 0,
  EXPECTATION: 1,
  REALITY: 2,
  REMARKS: 3,
};

const progressBarLevel = {
  TIME: 25,
  EXPECTATION: 50,
  REALITY: 75,
  REMARKS: 100,
};

export default function SessionEditModal({
  isOpen,
  onClose,
  modalData,
  dataHandler,
}) {
  const toast = useToast();

  const selectedData = useRef<CCASession | null>(null);
  const [confirmationData, setConfirmationData] = useState<CCASession | null>(
    null,
  );

  const [progressLevel, setProgressLevel] = useState(levels.TIME);
  const [progressBar, setProgressBar] = useState(progressBarLevel.TIME);
  const [loadingData, setLoadingData] = useState(true);

  const [errorMsg, setError] = useState('');

  const sessionIDDB = useRef('');
  const ccaIDDB = useRef('');

  const [ccaName, setCCAName] = useState('');
  const [dateStr, setDateStr] = useState('');
  const dateStrDB = useRef('');
  const [name, setName] = useState('');
  const nameDB = useRef('');

  const [upcoming, setUpcoming] = useState(false);

  const [optional, setOptional] = useState(false);
  const optionalDB = useRef(false);

  const [endTimeDropdown, setEndTimeDropdown] = useState<JSX.Element[]>([]);
  const [startTimeDropdown, setStartTimeDropdown] = useState<JSX.Element[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const startTimeDB = useRef('');
  const endTimeDB = useRef('');

  const [remarks, setRemarks] = useState('');
  const [ldrNotes, setLdrNotes] = useState('');

  const remarksDB = useRef('');
  const ldrNotesDB = useRef('');

  const optionalText: string = `Hours from optional sessions will act as bonus hours ie they will not affect the total number of hours.
      Example: Yunus has attended 10 out of 12 hours. 
      If he attends a 3 hour optional session, his attendance will be boosted to 12 out of 12 hours`;

  const expectedText: string = `Select only the members who are expected to turn up for this session.
      Hours allocated to this session will only affect the attendance percentage of the members selected on this page.`;

  const realityText: string = `Members who turned up for the session can be selected, then assigned partial or
      full hours.`;

  const [submitButtonPressed, setSubmitButtonPressed] = useState(false);
  const [disableButton, setDisableButton] = useState(false);

  const memberData = useRef<CCARecord[]>([]);

  const [expectedMemberButtons, setExpectedMemberButtons] = useState<
    JSX.Element[]
  >([]);
  const selectedExpectedMembers = useRef<string[]>([]);
  const selectedExpectedMembersName = useRef<string[]>([]);
  const [displayedExpected, setDisplayedExpected] = useState('');

  const selectedRealityMembers = useRef<string[]>([]);
  const [displayedReality, setDisplayedReality] = useState('');
  const selectedRealityMembersName = useRef<string[]>([]);
  const [realityMemberButtons, setRealityMemberButtons] = useState<
    JSX.Element[]
  >([]);
  const realityMemberHours = useRef<CCAAttendance[]>([]);

  const reset = () => {
    setDateStr('');
    setCCAName('');
    setOptional(false);
    setEndTimeDropdown([]);
    setStartTimeDropdown([]);
    setStartTime('');
    setEndTime('');
    setProgressLevel(levels.TIME);
    setProgressBar(progressBarLevel.TIME);
    setError('');
    setName('');
    setUpcoming(false);
    setRemarks('');
    setLdrNotes('');

    setDisplayedExpected('');
    setDisplayedReality('');

    setDisableButton(false);
    setSubmitButtonPressed(false);

    startTimeDB.current = '';
    endTimeDB.current = '';
    optionalDB.current = false;
    dateStrDB.current = '';
    sessionIDDB.current = '';
    ccaIDDB.current = '';
    nameDB.current = '';
    remarksDB.current = '';
    ldrNotesDB.current = '';

    memberData.current = [];

    selectedRealityMembers.current = [];
    selectedExpectedMembers.current = [];

    selectedExpectedMembersName.current = [];
    selectedRealityMembersName.current = [];
    realityMemberHours.current = [];
  };

  const handleModalCloseButton = () => {
    setTimeout(() => {
      reset();
      dataHandler();
      onClose();
    }, 200);
  };

  const validateFieldsEdit = (
    idField: string,
    dateField: string,
    startTimeField: string,
    endTimeField: string,
  ) => {
    if (!checkerString(idField)) {
      setError('Please select an event!');
      return false;
    }

    if (!checkerString(startTimeField)) {
      setError('Please set a start time!');
      return false;
    }

    if (!checkerString(endTimeField)) {
      setError('Please set an end time!');
      return false;
    }

    const day = new Date(dateField);

    if (!isValidDate(day)) {
      setError('Incorrect date format');
      return false;
    }

    if (Number(endTimeField) <= Number(startTimeField)) {
      setError('End time cannot be earlier than start time!');
      return false;
    }

    return true;
  };

  const validateFieldsSubmit = (selectedDataField: CCASession) => {
    if (!selectedDataField.id || !checkerString(selectedDataField.id)) {
      setError('Please select a session!');
      return false;
    }

    if (!selectedDataField.name || !checkerString(selectedDataField.name)) {
      setError('Please set a name!');
      return false;
    }

    if (!selectedDataField.time || !checkerString(selectedDataField.time)) {
      setError('Please set a time!');
      return false;
    }

    if (
      !selectedDataField.remarks ||
      !checkerString(selectedDataField.remarks)
    ) {
      setError('Please set a remark!');
      return false;
    }

    if (
      !selectedDataField.ldrNotes ||
      !checkerString(selectedDataField.ldrNotes)
    ) {
      setError('Please set a note!');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (selectedData.current !== null) {
      const data: CCASession = selectedData.current;
      data.remarks = remarksDB.current;
      data.ldrNotes = ldrNotesDB.current;
      selectedData.current = data;

      if (validateFieldsSubmit(selectedData.current)) {
        setConfirmationData(selectedData.current);
      }
    }
  };

  const handleClick = async (next: boolean) => {
    if (progressLevel === levels.TIME) {
      if (selectedData.current !== null) {
        if (
          validateFieldsEdit(
            sessionIDDB.current,
            dateStrDB.current,
            startTimeDB.current,
            endTimeDB.current,
          )
        ) {
          const data: CCASession = selectedData.current;
          data.date = convertDateToUnix(dateStrDB.current);
          data.dateStr = dateStrDB.current;
          data.time = `${startTimeDB.current} - ${endTimeDB.current}`;
          data.optional = optionalDB.current;
          data.optionalStr = optionalDB.current ? 'Yes' : 'No';
          data.name = nameDB.current;

          data.duration = await calculateDuration(
            Number(startTimeDB.current),
            Number(endTimeDB.current),
          );

          selectedData.current = data;
        }

        if (next) {
          setProgressLevel(levels.EXPECTATION);
          setProgressBar(progressBarLevel.EXPECTATION);
        }
      }
    } else if (progressLevel === levels.EXPECTATION) {
      if (selectedData.current !== null) {
        const data: CCASession = selectedData.current;
        data.expectedM = selectedExpectedMembers.current.toString();
        data.expectedMName = selectedExpectedMembersName.current.toString();
        selectedData.current = data;
        if (next) {
          setProgressLevel(levels.REALITY);
          setProgressBar(progressBarLevel.REALITY);
        } else {
          setProgressLevel(levels.TIME);
          setProgressBar(progressBarLevel.TIME);
        }
      }
    } else if (progressLevel === levels.REALITY) {
      if (selectedData.current !== null) {
        const data: CCASession = selectedData.current;
        data.realityM = JSON.stringify(realityMemberHours.current);
        selectedData.current = data;
        if (next) {
          setProgressLevel(levels.REMARKS);
          setProgressBar(progressBarLevel.REMARKS);
        } else {
          setProgressLevel(levels.EXPECTATION);
          setProgressBar(progressBarLevel.EXPECTATION);
        }
      }
    } else if (progressLevel === levels.REMARKS) {
      if (selectedData.current !== null) {
        const data: CCASession = selectedData.current;
        data.remarks = remarksDB.current;
        data.ldrNotes = ldrNotesDB.current;
        selectedData.current = data;
        if (!next) {
          setProgressLevel(levels.REALITY);
          setProgressBar(progressBarLevel.REALITY);
        }
      }
    }
  };

  const onStartTimeChange = async (event: { target: { value: string } }) => {
    if (event.target.value) {
      const { value } = event.target;
      startTimeDB.current = value;
      setStartTime(value);
    }
  };

  const onEndTimeChange = async (event: { target: { value: string } }) => {
    if (event.target.value) {
      const { value } = event.target;
      endTimeDB.current = value;
      setEndTime(value);
    }
  };

  const handleOptionalHover = () => {
    toast.closeAll();

    toast({
      description: optionalText,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleExpectedHover = () => {
    toast.closeAll();

    toast({
      description: expectedText,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleRealityHover = () => {
    toast.closeAll();

    toast({
      description: realityText,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const generateTimeSlots = useCallback(async () => {
    const start: JSX.Element[] = [];
    const end: JSX.Element[] = [];

    start.push(<option key='start' value='' aria-label='Default' />);
    end.push(<option key='end' value='' aria-label='Default' />);

    for (let key = 0; key <= Object.keys(timeSlots).length; key += 1) {
      if (timeSlots[key]) {
        const dataField: string = timeSlots[key];
        start.push(
          <option key={`start${key}`} value={dataField}>
            {dataField}
          </option>,
        );

        end.push(
          <option key={`end${key}`} value={dataField}>
            {dataField}
          </option>,
        );
      }
    }

    setStartTimeDropdown(start);
    setEndTimeDropdown(end);
  }, []);

  const displayExpectedMembers = (members: string[]) => {
    if (members.length > 0) {
      let text: string = 'Selected members(s): ';
      let counter: number = 0;

      for (let key = 0; key < members.length; key += 1) {
        if (members[key]) {
          counter += 1;
          if (counter !== members.length) {
            text += ` ${members[key]} ,`;
          } else {
            text += ` ${members[key]} `;
          }
        }
      }

      setDisplayedExpected(text);
    } else {
      setDisplayedExpected('');
    }
  };

  const displayRealityMembers = (members: CCAAttendance[]) => {
    if (members.length > 0) {
      let text: string = 'Selected members(s): ';
      let counter: number = 0;

      for (let key = 0; key < members.length; key += 1) {
        if (members[key]) {
          counter += 1;
          if (
            members[key].sessionName !== undefined &&
            members[key].ccaAttendance !== undefined
          ) {
            if (counter !== members.length) {
              text += ` ${members[key].sessionName} (${members[key].ccaAttendance} hours) ,`;
            } else {
              text += ` ${members[key].sessionName} (${members[key].ccaAttendance} hours)  `;
            }
          }
        }
      }

      setDisplayedReality(text);
    } else {
      setDisplayedReality('');
    }
  };

  const fetchNameOfUser = async (id: string): Promise<string> => {
    let res: string = '';

    if (memberData.current.length > 0) {
      for (let key = 0; key < memberData.current.length; key += 1) {
        if (memberData.current[key]) {
          const record: CCARecord = memberData.current[key];
          if (record.sessionID === id && record.sessionName !== undefined) {
            res = record.sessionName;
            break;
          }
        }
      }
    }

    return res;
  };

  const onExpectedMemberChange = useCallback(async (value: string) => {
    if (checkerString(value)) {
      const nameField: string = await fetchNameOfUser(value);
      let members: string[] = selectedExpectedMembers.current;
      let membersName: string[] = selectedExpectedMembersName.current;
      if (members.includes(value)) {
        members = members.filter((item) => item !== value);
        if (checkerString(nameField)) {
          membersName = membersName.filter((item) => item !== nameField);
        }
      } else {
        members.push(value);
        if (checkerString(nameField)) {
          membersName.push(nameField);
        }
      }

      selectedExpectedMembers.current = members;
      selectedExpectedMembersName.current = membersName;

      displayExpectedMembers(selectedExpectedMembersName.current);
    }
  }, []);

  const onRealityMemberChange = useCallback(async (value: string) => {
    if (checkerString(value)) {
      const nameField: string = await fetchNameOfUser(value);
      let members: string[] = selectedRealityMembers.current;
      let membersName: string[] = selectedRealityMembersName.current;
      if (members.includes(value)) {
        members = members.filter((item) => item !== value);
        membersName = membersName.filter((item) => item !== nameField);
      } else {
        members.push(value);
        membersName.push(nameField);
      }

      selectedRealityMembers.current = members;
      selectedRealityMembersName.current = membersName;
    }
  }, []);

  const onHoursChange = useCallback(
    async (id: string, nameField: string, hour: number) => {
      setError('');
      setDisableButton(false);
      if (
        selectedData.current !== null &&
        selectedData.current.duration !== undefined &&
        hour > 0 &&
        hour <= selectedData.current.duration
      ) {
        await onRealityMemberChange(id);

        const realityHours: CCAAttendance[] = realityMemberHours.current;
        let notFound = false;

        for (let key = 0; key < realityHours.length; key += 1) {
          if (realityHours[key]) {
            const reality: CCAAttendance = realityHours[key];
            if (reality.sessionID === id) {
              reality.ccaAttendance = hour;
              notFound = true;
              break;
            }
          }
        }

        if (!notFound) {
          const attendance: CCAAttendance = {
            ccaID: ccaIDDB.current,
            ccaAttendance: hour,
            sessionID: id,
            sessionName: nameField,
          };

          realityHours.push(attendance);
        }
        realityMemberHours.current = realityHours;
      } else if (hour === 0) {
        await onRealityMemberChange(id);

        let realityHours: CCAAttendance[] = realityMemberHours.current;
        let notFound = false;
        let attendance: CCAAttendance;

        for (let key = 0; key < realityHours.length; key += 1) {
          if (realityHours[key]) {
            const reality: CCAAttendance = realityHours[key];
            if (reality.sessionID === id) {
              notFound = true;
              attendance = {
                ccaID: ccaIDDB.current,
                ccaAttendance: reality.ccaAttendance,
                sessionID: id,
                sessionName: nameField,
              };
              break;
            }
          }
        }

        if (notFound) {
          realityHours = realityHours.filter(
            (item) => JSON.stringify(item) !== JSON.stringify(attendance),
          );
        }

        realityMemberHours.current = realityHours;
      } else if (
        selectedData.current !== null &&
        selectedData.current.duration !== undefined
      ) {
        setError(
          `Duration of member must not be negative or exceed ${selectedData.current.duration}`,
        );
        setDisableButton(true);
      }

      displayRealityMembers(realityMemberHours.current);
    },
    [onRealityMemberChange],
  );

  const generateExpectedMemberList = useCallback(async () => {
    if (
      memberData.current.length > 0 &&
      selectedExpectedMembers.current.length > 0
    ) {
      const memberName: string[] = [];

      for (
        let key = 0;
        key < selectedExpectedMembers.current.length;
        key += 1
      ) {
        if (selectedExpectedMembers.current[key]) {
          const s: string = selectedExpectedMembers.current[key];
          const nameField: string = await fetchNameOfUser(s);
          memberName.push(nameField);
        }
      }

      selectedExpectedMembersName.current = memberName;
      displayExpectedMembers(selectedExpectedMembersName.current);
    }
  }, []);

  const buildMemberList = useCallback(
    async (content: { count: number; res: CCARecord[] }) => {
      if (content.res !== [] && content.count > 0) {
        const buttons: JSX.Element[] = [];
        const realityButtons: JSX.Element[] = [];

        for (let key = 0; key < content.res.length; key += 1) {
          if (content.res[key]) {
            const record: CCARecord = content.res[key];
            if (
              record.sessionID !== undefined &&
              record.sessionName !== undefined
            ) {
              const { sessionID } = record;
              const { sessionName } = record;

              buttons.push(
                <MemberButton
                  reality={false}
                  key={sessionID}
                  handleClick={onExpectedMemberChange}
                  newKey={sessionID}
                  id={sessionID}
                  name={sessionName}
                />,
              );

              realityButtons.push(
                <MemberButton
                  reality
                  key={sessionID}
                  handleClick={onHoursChange}
                  newKey={sessionID}
                  id={sessionID}
                  name={sessionName}
                />,
              );
            }
          }
        }

        memberData.current = content.res;
        setExpectedMemberButtons(buttons);
        setRealityMemberButtons(realityButtons);
        await generateExpectedMemberList();
      }
    },
    [onExpectedMemberChange, onHoursChange, generateExpectedMemberList],
  );

  const generateMemberList = useCallback(async () => {
    if (checkerString(sessionIDDB.current)) {
      try {
        const rawResponse = await fetch('/api/ccaRecord/fetch', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: ccaIDDB.current,
          }),
        });
        const content: Result = await rawResponse.json();
        if (content.status) {
          await buildMemberList(content.msg);
        }
      } catch (error) {
        console.error(error);
      }

      return true;
    }
    return false;
  }, [buildMemberList]);

  useEffect(() => {
    async function setupData(modalDataField: CCASession) {
      setLoadingData(true);
      setSubmitButtonPressed(true);

      const idField: string =
        modalDataField && modalDataField.id ? modalDataField.id : '';
      sessionIDDB.current = idField;

      const ccaidField: string =
        modalDataField && modalDataField.ccaID ? modalDataField.ccaID : '';
      ccaIDDB.current = ccaidField;

      const dateStrField: string =
        modalDataField && modalDataField.dateStr ? modalDataField.dateStr : '';
      const ccaNameField: string =
        modalDataField && modalDataField.ccaName ? modalDataField.ccaName : '';

      const nameField: string =
        modalDataField && modalDataField.name ? modalDataField.name : '';
      setName(nameField);
      nameDB.current = nameField;

      setDateStr(dateStrField);
      dateStrDB.current = dateStrField;

      setCCAName(ccaNameField);

      const split: string[] =
        modalDataField && modalDataField.time
          ? modalDataField.time.split('-')
          : [' - '];
      const start: string = split[0].trim();
      const end: string = split[1].trim();

      startTimeDB.current = start;
      endTimeDB.current = end;
      setStartTime(start);
      setEndTime(end);

      const day: Date = new Date(dateStrField);
      if (isValidDate(day)) {
        if (day > new Date()) {
          const currentTime: string = moment
            .tz(moment(), 'Asia/Singapore')
            .format('HH:mm')
            .replace(':', '');
          if (Number(currentTime) >= Number(start)) {
            setUpcoming(true);
          } else {
            setUpcoming(false);
          }
        } else {
          setUpcoming(false);
        }
      }

      const opt: boolean =
        modalDataField && modalDataField.optional
          ? modalDataField.optional
          : false;
      setOptional(opt);

      const expectedM: string =
        modalDataField && modalDataField.expectedM
          ? modalDataField.expectedM
          : '';
      if (expectedM.length > 0) {
        selectedExpectedMembers.current = expectedM.split(',');
      }

      const remark: string =
        modalDataField && modalDataField.remarks ? modalDataField.remarks : '';
      setRemarks(remark);
      remarksDB.current = remark;

      const ldrNote: string =
        modalDataField && modalDataField.ldrNotes
          ? modalDataField.ldrNotes
          : '';
      setLdrNotes(ldrNote);
      ldrNotesDB.current = ldrNote;

      selectedData.current = JSON.parse(JSON.stringify(modalDataField));

      await generateTimeSlots();
      await generateMemberList();
      setLoadingData(false);
      setSubmitButtonPressed(false);
    }

    if (modalData) {
      setupData(modalData);
    }
  }, [modalData, generateTimeSlots, generateMemberList]);

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={handleModalCloseButton}
      size='full'
      isCentered
      motionPreset='slideInBottom'
      scrollBehavior='inside'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader />
        <ModalBody>
          <SessionEditConfirmationModal
            isOpen={confirmationData}
            onClose={() => setConfirmationData(null)}
            modalData={confirmationData}
            dataHandler={handleModalCloseButton}
          />

          <LoadingModal
            isOpen={!!submitButtonPressed}
            onClose={() => setSubmitButtonPressed(false)}
          />

          <Stack spacing={5} w='full' align='center'>
            <Box>
              <Text
                mt={2}
                mb={6}
                textTransform='uppercase'
                fontSize={{ base: '2xl', sm: '2xl', lg: '3xl' }}
                lineHeight='5'
                fontWeight='bold'
                letterSpacing='tight'
                color='gray.900'
              >
                {ccaName}
              </Text>
            </Box>
          </Stack>

          <MotionSimpleGrid
            mt='3'
            minChildWidth={{ base: 'full', md: '500px', lg: '800px' }}
            spacing='2em'
            minH='full'
            variants={parentVariant}
            initial='initial'
            animate='animate'
          >
            <Progress hasStripe value={progressBar} />

            <MotionBox variants={cardVariant} key='motion-box-time2'>
              {modalData && !loadingData && progressLevel === levels.TIME && (
                <Flex
                  w='full'
                  h='full'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Stack spacing={10}>
                    <Stack
                      w={{ base: 'full', md: '500px', lg: '500px' }}
                      direction='row'
                    >
                      <FormControl id='name'>
                        <FormLabel>
                          <Text
                            w={40}
                            textTransform='uppercase'
                            lineHeight='5'
                            fontWeight='bold'
                            letterSpacing='tight'
                            mr={5}
                          >
                            Name
                          </Text>
                        </FormLabel>
                        <Input
                          type='text'
                          placeholder='Name'
                          value={name}
                          size='lg'
                          onChange={(event) => {
                            setName(event.currentTarget.value);
                            nameDB.current = event.currentTarget.value;
                          }}
                        />
                      </FormControl>

                      <FormControl id='date'>
                        <FormLabel>
                          <Text
                            w={40}
                            textTransform='uppercase'
                            lineHeight='5'
                            fontWeight='bold'
                            letterSpacing='tight'
                            mr={5}
                          >
                            Date
                          </Text>
                        </FormLabel>
                        <Input
                          disabled
                          type='date'
                          placeholder='Date'
                          value={dateStr}
                          size='lg'
                          onChange={(event) => {
                            setDateStr(event.currentTarget.value);
                            dateStrDB.current = event.currentTarget.value;
                          }}
                        />
                      </FormControl>
                    </Stack>
                    {startTimeDropdown && (
                      <Stack w={{ base: 'full', md: '500px', lg: '500px' }}>
                        <FormLabel>
                          <Text
                            w={40}
                            textTransform='uppercase'
                            lineHeight='5'
                            fontWeight='bold'
                            letterSpacing='tight'
                            mr={5}
                          >
                            Start Time
                          </Text>
                        </FormLabel>
                        <Select
                          value={startTime}
                          onChange={onStartTimeChange}
                          size='md'
                        >
                          {endTimeDropdown}
                        </Select>
                      </Stack>
                    )}

                    {endTimeDropdown && (
                      <Stack w={{ base: 'full', md: '500px', lg: '500px' }}>
                        <FormLabel>
                          <Text
                            w={40}
                            textTransform='uppercase'
                            lineHeight='5'
                            fontWeight='bold'
                            letterSpacing='tight'
                            mr={5}
                          >
                            End Time
                          </Text>
                        </FormLabel>
                        <Select
                          value={endTime}
                          onChange={onEndTimeChange}
                          size='md'
                        >
                          {endTimeDropdown}
                        </Select>
                      </Stack>
                    )}

                    <Stack spacing={5} direction='row'>
                      <Checkbox
                        isChecked={optional}
                        onChange={(event) => {
                          if (event.cancelable) {
                            event.preventDefault();
                          }
                          setOptional(event.target.checked);
                          optionalDB.current = event.target.checked;
                        }}
                      >
                        Optional Session
                      </Checkbox>
                      <InfoIcon onMouseEnter={handleOptionalHover} />
                    </Stack>
                  </Stack>
                </Flex>
              )}

              {modalData &&
                !loadingData &&
                progressLevel === levels.EXPECTATION && (
                  <Flex
                    w='full'
                    h='full'
                    alignItems='center'
                    justifyContent='center'
                  >
                    <Stack spacing={10}>
                      <Stack
                        w={{ base: 'full', md: '500px', lg: '500px' }}
                        direction='row'
                      >
                        {selectedData.current?.duration && (
                          <List spacing={5}>
                            <ListItem>
                              <Stack direction='row'>
                                <Text
                                  textTransform='uppercase'
                                  letterSpacing='tight'
                                  fontWeight='bold'
                                >
                                  Duration
                                </Text>{' '}
                                <Text>
                                  {selectedData.current?.duration} Hours
                                </Text>
                              </Stack>
                            </ListItem>
                          </List>
                        )}
                      </Stack>

                      {expectedMemberButtons.length > 0 && (
                        <Stack w={{ base: 'full', md: '500px', lg: '500px' }}>
                          <FormLabel>
                            <Stack direction='row'>
                              <Text
                                w={40}
                                textTransform='uppercase'
                                lineHeight='5'
                                fontWeight='bold'
                                letterSpacing='tight'
                                mr={5}
                              >
                                Expected Members
                              </Text>
                              <InfoIcon onMouseEnter={handleExpectedHover} />
                            </Stack>
                          </FormLabel>

                          <Text>{displayedExpected}</Text>
                          <Stack direction={['column', 'row']} align='center'>
                            <ButtonGroup display='flex' flexWrap='wrap'>
                              {expectedMemberButtons}
                            </ButtonGroup>
                          </Stack>
                        </Stack>
                      )}
                    </Stack>
                  </Flex>
              )}

              {modalData &&
                !loadingData &&
                progressLevel === levels.REALITY &&
                !upcoming && (
                  <Flex
                    w='full'
                    h='full'
                    alignItems='center'
                    justifyContent='center'
                  >
                    <Stack spacing={10}>
                      <Stack
                        w={{ base: 'full', md: '500px', lg: '500px' }}
                        direction='row'
                      >
                        {selectedData.current?.duration && (
                          <List spacing={5}>
                            <ListItem>
                              <Stack direction='row'>
                                <Text
                                  textTransform='uppercase'
                                  letterSpacing='tight'
                                  fontWeight='bold'
                                >
                                  Duration
                                </Text>{' '}
                                <Text>
                                  {selectedData.current?.duration} Hours
                                </Text>
                              </Stack>
                            </ListItem>
                          </List>
                        )}
                      </Stack>

                      {realityMemberButtons.length > 0 && (
                        <Stack w={{ base: 'full', md: '500px', lg: '500px' }}>
                          <FormLabel>
                            <Stack direction='row'>
                              <Text
                                w={40}
                                textTransform='uppercase'
                                lineHeight='5'
                                fontWeight='bold'
                                letterSpacing='tight'
                                mr={5}
                              >
                                Members Present
                              </Text>
                              <InfoIcon onMouseEnter={handleRealityHover} />
                            </Stack>
                          </FormLabel>

                          <Text>{displayedReality}</Text>
                          <Stack direction={['column', 'row']} align='center'>
                            <ButtonGroup display='flex' flexWrap='wrap'>
                              {realityMemberButtons}
                            </ButtonGroup>
                          </Stack>
                        </Stack>
                      )}
                    </Stack>
                  </Flex>
              )}

              {modalData &&
                !loadingData &&
                progressLevel === levels.REALITY &&
                upcoming && (
                  <Flex
                    w='full'
                    h='full'
                    alignItems='center'
                    justifyContent='center'
                  >
                    <Stack spacing={10}>
                      <Text color='red.500'>
                        Unable to mark attendance. The session has not
                        commenced.
                      </Text>
                      <Text color='red.500'>Click next to proceed.</Text>
                    </Stack>
                  </Flex>
              )}

              {modalData && !loadingData && progressLevel === levels.REMARKS && (
                <Flex
                  w='full'
                  h='full'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Stack spacing={10}>
                    <Stack
                      w={{ base: 'full', md: '500px', lg: '500px' }}
                      direction='column'
                    >
                      <FormControl id='remarks'>
                        <FormLabel>
                          <Stack direction='row'>
                            <Text
                              w={40}
                              textTransform='uppercase'
                              lineHeight='5'
                              fontWeight='bold'
                              letterSpacing='tight'
                              mr={5}
                            >
                              General Remarks
                            </Text>
                          </Stack>
                        </FormLabel>
                        <Textarea
                          height={150}
                          placeholder='Remarks (200 characters)'
                          size='lg'
                          value={remarks}
                          onChange={(event) => {
                            setRemarks(event.currentTarget.value);
                            remarksDB.current = event.currentTarget.value;
                          }}
                        />
                      </FormControl>

                      <FormControl id='leader-notes'>
                        <FormLabel>
                          <Stack direction='row'>
                            <Text
                              w={40}
                              textTransform='uppercase'
                              lineHeight='5'
                              fontWeight='bold'
                              letterSpacing='tight'
                              mr={5}
                            >
                              Leaders&apos; Notes
                            </Text>
                          </Stack>
                        </FormLabel>
                        <Textarea
                          height={150}
                          placeholder='Remarks (200 characters)'
                          size='lg'
                          value={ldrNotes}
                          onChange={(event) => {
                            setLdrNotes(event.currentTarget.value);
                            ldrNotesDB.current = event.currentTarget.value;
                          }}
                        />
                      </FormControl>
                    </Stack>
                  </Stack>
                </Flex>
              )}

              {checkerString(errorMsg) && (
                <Stack align='center'>
                  <Text>{errorMsg}</Text>
                </Stack>
              )}
            </MotionBox>
          </MotionSimpleGrid>
        </ModalBody>
        <ModalFooter>
          {progressLevel !== levels.TIME && (
            <Button
              disabled={disableButton}
              bg='blue.400'
              color='white'
              w='150px'
              size='lg'
              _hover={{ bg: 'blue.600' }}
              mr={5}
              onClick={async () => {
                await handleClick(false);
              }}
            >
              Previous
            </Button>
          )}

          {progressLevel !== levels.REMARKS && (
            <Button
              disabled={disableButton}
              bg='gray.400'
              color='white'
              w='150px'
              size='lg'
              _hover={{ bg: 'gray.600' }}
              onClick={async () => {
                await handleClick(true);
              }}
            >
              Next
            </Button>
          )}

          {progressLevel === levels.REMARKS && (
            <Button
              disabled={disableButton}
              bg='red.400'
              color='white'
              w='150px'
              size='lg'
              _hover={{ bg: 'red.600' }}
              onClick={async () => {
                await handleSubmit();
              }}
            >
              Submit
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
