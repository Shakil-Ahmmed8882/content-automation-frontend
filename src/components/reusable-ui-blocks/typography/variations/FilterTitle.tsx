import Heading from "../Heading";

export const FilterTitle = ({ text }: { text: string }) => {
  return (
    <>
      <Heading
        as={"h3"}
        className="text-foreground !text-[17px] !font-semibold leading-[140%]"
      >
        {text}
      </Heading>
    </>
  );
};
