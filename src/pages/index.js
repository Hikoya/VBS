import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { cardVariant, parentVariant } from "@root/motion";
import ProductModal from "@components/ProductModal ";
import { motion } from "framer-motion";
import data from "@root/data";
import ProductCard from "@components/ProductCard";
import { Box, SimpleGrid } from "@chakra-ui/react";

const MotionSimpleGrid = motion(SimpleGrid);
const MotionBox = motion(Box);

export default function Home() {
  const { data: session } = useSession();
  const [modalData, setModalData] = useState(null);
  
  if (session) {
  return (
    <Box>
      <MotionSimpleGrid
        mt="4"
        minChildWidth="250px"
        spacing="2em"
        minH="full"
        variants={parentVariant}
        initial="initial"
        animate="animate"
      >
        {data.map((product, i) => (
          <MotionBox variants={cardVariant} key={i}>
            <ProductCard product={product} setModalData={setModalData} />
          </MotionBox>
        ))}
      </MotionSimpleGrid>
      <ProductModal
        isOpen={modalData ? true : false}
        onClose={() => setModalData(null)}
        modalData={modalData}
      />
    </Box>
  );
  } else {
    return (
      <>
        Not signed in <br />
        <button onClick={() => signIn()}>Sign in</button>
      </>
    );
  }
  
  

}






const Index = (_props) => {
  const { data: session } = useSession();

  
 
};

export default Index;

