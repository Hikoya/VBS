import { cardVariant, parentVariant } from "@root/motion";
import { motion } from "framer-motion";
import { SimpleGrid, Box } from "@chakra-ui/react";
import Auth from "@components/Auth";
import { getAllLocation } from "@constants/helper";
import ProductCard from "@components/ProductCard";
const MotionSimpleGrid = motion(SimpleGrid);
const MotionBox = motion(Box);

export default function VBS({data}) {
  return (
    <Auth>
      <Box>
        <MotionSimpleGrid
          mt="3"
          minChildWidth="250px"
          spacing="2em"
          minH="full"
          variants={parentVariant}
          initial="initial"
          animate="animate"
        >
        </MotionSimpleGrid>
      </Box>
    </Auth>
  );
}

export async function getServerSideProps() {
    const data = await getAllLocation();
    console.log(data);
    return { props: { data } }
}