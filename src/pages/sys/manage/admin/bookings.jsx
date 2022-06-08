import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Button,
  ButtonGroup,
  Box,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Text,
  Tabs,
  TabList,
  Tab,
  SimpleGrid,
  Stack,
  Select,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import Auth from '@components/sys/Auth';
import TableWidget from '@components/sys/vbs/TableWidget';
import BookingModal from '@components/sys/vbs/BookingModal';
import BookingCalendar from '@components/sys/vbs/BookingCalendar';
import { parentVariant } from '@root/motion';
import { motion } from 'framer-motion';

const MotionSimpleGrid = motion(SimpleGrid);

export default function ManageBooking() {
  const [modalData, setModalData] = useState(null);

  const toast = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const ALL = 3;
  const PENDING = 0;
  const APPROVED = 1;
  const REJECTED = 2;

  const [tabIndex, setTabIndex] = useState(0);
  const tabIndexData = useRef(0);

  const venueData = useRef([]);
  const [venueDropdown, setVenueDropdown] = useState([]);
  const [venueID, setVenueID] = useState('');
  const venueIDDB = useRef('');

  const [events, setEvents] = useState(null);
  const [startTime, setStartTime] = useState('08:00:00');
  const [endTime, setEndTime] = useState('23:00:00');

  const [search, setSearch] = useState('');

  let handleTabChange;

  const handleApprove = useCallback(
    async (id) => {
      if (id) {
        try {
          const rawResponse = await fetch('/api/bookingReq/approve', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: id,
            }),
          });
          const content = await rawResponse.json();
          if (content.status) {
            toast({
              title: 'Request approved.',
              description: 'An email has been sent to the requester',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            await handleTabChange(tabIndexData.current);
          } else {
            toast({
              title: 'Error',
              description: content.error,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }

          return true;
        } catch (error) {
          return false;
        }
      }

      return false;
    },
    [handleTabChange, toast],
  );

  const handleReject = useCallback(
    async (id) => {
      if (id) {
        try {
          const rawResponse = await fetch('/api/bookingReq/reject', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: id,
            }),
          });
          const content = await rawResponse.json();
          if (content.status) {
            toast({
              title: 'Request rejected.',
              description: 'An email has been sent to the requester',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            await handleTabChange(tabIndexData.current);
          } else {
            toast({
              title: 'Error',
              description: content.error,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
          return true;
        } catch (error) {
          return false;
        }
      }

      return false;
    },
    [handleTabChange, toast],
  );

  const handleDetails = useCallback((content) => {
    setModalData(content);
  }, []);

  const generateActionButton = useCallback(
    async (content, action) => {
      let button = null;

      switch (action) {
        case ALL:
          if (content.status === 'PENDING') {
            button = (
              <ButtonGroup>
                <Button
                  size='sm'
                  leftIcon={<CheckIcon />}
                  onClick={() => handleApprove(content.id)}
                >
                  Approve
                </Button>
                <Button
                  size='sm'
                  leftIcon={<CloseIcon />}
                  onClick={() => handleReject(content.id)}
                >
                  Reject
                </Button>
                <Button
                  size='sm'
                  leftIcon={<InfoOutlineIcon />}
                  onClick={() => handleDetails(content)}
                >
                  View Details
                </Button>
              </ButtonGroup>
            );
            return button;
          }
          button = (
            <ButtonGroup>
              <Button
                size='sm'
                leftIcon={<InfoOutlineIcon />}
                onClick={() => handleDetails(content)}
              >
                View Details
              </Button>
            </ButtonGroup>
          );
          return button;

        case APPROVED:
          button = (
            <ButtonGroup>
              <Button
                size='sm'
                leftIcon={<InfoOutlineIcon />}
                onClick={() => handleDetails(content)}
              >
                View Details
              </Button>
            </ButtonGroup>
          );
          return button;
        case REJECTED:
          button = (
            <ButtonGroup>
              <Button
                size='sm'
                leftIcon={<InfoOutlineIcon />}
                onClick={() => handleDetails(content)}
              >
                View Details
              </Button>
            </ButtonGroup>
          );
          return button;
        case PENDING:
          if (content.status === 'PENDING') {
            button = (
              <ButtonGroup>
                <Button
                  size='sm'
                  leftIcon={<CheckIcon />}
                  onClick={() => handleApprove(content.id)}
                >
                  Approve
                </Button>
                <Button
                  size='sm'
                  leftIcon={<CloseIcon />}
                  onClick={() => handleReject(content.id)}
                >
                  Reject
                </Button>
                <Button
                  size='sm'
                  leftIcon={<InfoOutlineIcon />}
                  onClick={() => handleDetails(content)}
                >
                  View Details
                </Button>
              </ButtonGroup>
            );
            return button;
          }
          button = (
            <ButtonGroup>
              <Button
                size='sm'
                leftIcon={<InfoOutlineIcon />}
                onClick={() => handleDetails(content)}
              >
                View Details
              </Button>
            </ButtonGroup>
          );
          return button;
        default:
          return button;
      }
    },
    [handleApprove, handleDetails, handleReject],
  );

  const includeActionButton = useCallback(
    async (content, action) => {
      for (let key = 0; key < content.length; key += 1) {
        if (content[key]) {
          const dataField = content[key];
          const buttons = await generateActionButton(dataField, action);
          dataField.action = buttons;
        }
      }
      setData(content);
    },
    [generateActionButton],
  );

  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    setData(null);
    try {
      const rawResponse = await fetch('/api/bookingReq/fetch', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const content = await rawResponse.json();
      if (content.status) {
        await includeActionButton(content.msg, ALL);
      }

      setLoadingData(false);
    } catch (error) {
      console.log(error);
    }
  }, [includeActionButton]);

  const fetchApprovedData = useCallback(async () => {
    setLoadingData(true);
    setData(null);
    try {
      const rawResponse = await fetch('/api/bookingReq/fetch?q=APPROVED', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const content = await rawResponse.json();
      if (content.status) {
        await includeActionButton(content.msg, APPROVED);
      }

      setLoadingData(false);
    } catch (error) {
      console.log(error);
    }
  }, [includeActionButton]);

  const fetchRejectedData = useCallback(async () => {
    setLoadingData(true);
    setData(null);

    try {
      const rawResponse = await fetch('/api/bookingReq/fetch?q=REJECTED', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const content = await rawResponse.json();
      if (content.status) {
        await includeActionButton(content.msg, REJECTED);
      }
      setLoadingData(false);
    } catch (error) {
      console.log(error);
    }
  }, [includeActionButton]);

  const fetchPendingData = useCallback(async () => {
    setLoadingData(true);
    setData(null);
    try {
      const rawResponse = await fetch('/api/bookingReq/fetch?q=PENDING', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const content = await rawResponse.json();
      if (content.status) {
        await includeActionButton(content.msg, PENDING);
      }
      setLoadingData(false);
    } catch (error) {
      console.log(error);
    }
  }, [includeActionButton]);

  handleTabChange = useCallback(
    async (index) => {
      tabIndexData.current = index;
      setTabIndex(index);
      switch (index) {
        case PENDING:
          await fetchPendingData();
          break;
        case APPROVED:
          await fetchApprovedData();
          break;
        case REJECTED:
          await fetchRejectedData();
          break;
        case ALL:
          await fetchAllData();
          break;
        default:
          break;
      }
    },
    [fetchPendingData, fetchApprovedData, fetchAllData, fetchRejectedData],
  );

  const generateVenueDropdown = useCallback(async (content) => {
    const selection = [];
    venueData.current = [];

    selection.push(<option key='' value='' aria-label='Default' />);

    for (let key = 0; key < content.length; key += 1) {
      if (content[key]) {
        const dataField = content[key];
        selection.push(
          <option key={dataField.id} value={dataField.id}>
            {dataField.name}
          </option>,
        );

        venueData.current.push(dataField);
      }
    }

    setVenueDropdown(selection);
  }, []);

  const fetchVenue = useCallback(async () => {
    try {
      const rawResponse = await fetch('/api/venue/fetch', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const content = await rawResponse.json();
      if (content.status) {
        generateVenueDropdown(content.msg);
      }
    } catch (error) {
      console.log(error);
    }
  }, [generateVenueDropdown]);

  const populateCalendar = async (content) => {
    const event = [];
    let count = 0;

    for (let key = 0; key < content.length; key += 1) {
      if (content[key]) {
        const dataField = content[key];

        const description = `CCA: ${dataField.cca} EMAIL: ${dataField.email}`;

        const e = {
          id: dataField.id,
          title: dataField.title,
          start: dataField.start,
          end: dataField.end,
          extendedProps: {
            description: description,
          },
        };

        event.push(e);

        if (count === 0) {
          setStartTime(dataField.startHour);
          setEndTime(dataField.endHour);
          count += 1;
        }
      }
    }

    setEvents(event);
  };

  const fetchBookings = async (id) => {
    try {
      const rawResponse = await fetch('/api/booking/fetch', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
        }),
      });
      const content = await rawResponse.json();
      if (content.status) {
        await populateCalendar(content.msg);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onVenueIDChange = async (event) => {
    if (event.target.value) {
      const { value } = event.target;
      venueIDDB.current = value;
      setVenueID(value);
      await fetchBookings(value);
    }
  };

  const handleMouseEnter = (info) => {
    if (info.event.extendedProps.description) {
      toast({
        title: info.event.title,
        description: info.event.extendedProps.description,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleMouseLeave = () => {
    toast.closeAll();
  };

  const handleSearch = (event) => {
    const searchInput = event.target.value;
    setSearch(searchInput);

    if (searchInput && searchInput !== '') {
      const filteredDataField = data.filter(
        (value) =>
          value.purpose.toLowerCase().includes(searchInput.toLowerCase()) ||
          value.cca.toLowerCase().includes(searchInput.toLowerCase()) ||
          value.venue.toLowerCase().includes(searchInput.toLowerCase()) ||
          value.date.toLowerCase().includes(searchInput.toLowerCase()) ||
          value.timeSlots.toLowerCase().includes(searchInput.toLowerCase()) ||
          value.email.toLowerCase().includes(searchInput.toLowerCase()) ||
          value.status.toLowerCase().includes(searchInput.toLowerCase()),
      );

      setFilteredData(filteredDataField);
    } else {
      setFilteredData(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Venue',
        accessor: 'venue',
      },
      {
        Header: 'Date',
        accessor: 'date',
      },
      {
        Header: 'Timeslot(s)',
        accessor: 'timeSlots',
      },
      {
        Header: 'Email',
        accessor: 'email',
      },
      {
        Header: 'CCA',
        accessor: 'cca',
      },
      {
        Header: 'Purpose',
        accessor: 'purpose',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Actions',
        accessor: 'action',
      },
    ],
    [],
  );

  useEffect(() => {
    fetchPendingData();
    fetchVenue();
  }, [fetchPendingData, fetchVenue]);

  return (
    <Auth admin>
      <MotionSimpleGrid
        mt='3'
        columns={{ base: 1, md: 1, lg: 1 }}
        spacing='2em'
        minH='600px'
        variants={parentVariant}
        initial='initial'
        animate='animate'
      >
        <Box
          bg='white'
          borderRadius='lg'
          width={{ base: 'full', md: 'full', lg: 'full' }}
          p={8}
          color='gray.700'
          shadow='base'
        >
          {venueDropdown && (
            <Stack spacing={2} w='full' mb='10'>
              <FormLabel>Select Venue</FormLabel>
              <Select value={venueID} onChange={onVenueIDChange} size='sm'>
                {venueDropdown}
              </Select>
            </Stack>
          )}

          <BookingCalendar
            slotMax={endTime}
            slotMin={startTime}
            events={events}
            eventMouseEnter={handleMouseEnter}
            eventMouseLeave={handleMouseLeave}
          />
        </Box>

        <Box
          bg='white'
          borderRadius='lg'
          width={{ base: 'full', md: 'full', lg: 'full' }}
          p={8}
          color='gray.700'
          shadow='base'
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            size={{ base: 'md', md: 'md', lg: 'md' }}
            isManual
            isLazy
            isFitted
            variant='enclosed'
          >
            <TabList>
              <Tab>Pending Approval</Tab>
              <Tab>Approved</Tab>
              <Tab>Rejected</Tab>
              <Tab>All Bookings</Tab>
            </TabList>
            {loadingData && !data && (
              <Box align='center' justify='center' mt={30}>
                <Text>Loading Please wait...</Text>
              </Box>
            )}

            {!loadingData && data.length === 0 && (
              <Box align='center' justify='center' minWidth='full' mt={30}>
                <Text>No bookings found</Text>
              </Box>
            )}

            {!loadingData && data.length > 0 && (
              <Box align='center' justify='center' minWidth='full' mt={30}>
                <Stack spacing={30}>
                  <InputGroup>
                    <InputLeftAddon>Search:</InputLeftAddon>
                    <Input
                      type='text'
                      placeholder=''
                      value={search}
                      onChange={handleSearch}
                    />
                  </InputGroup>

                  <TableWidget
                    key={1}
                    columns={columns}
                    data={
                      filteredData && filteredData.length ? filteredData : data
                    }
                  />
                </Stack>
              </Box>
            )}

            <BookingModal
              isAdmin
              isOpen={!!modalData}
              onClose={() => setModalData(null)}
              modalData={modalData}
            />
          </Tabs>
        </Box>
      </MotionSimpleGrid>
    </Auth>
  );
}
