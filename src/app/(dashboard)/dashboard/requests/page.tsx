import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { FC } from "react";

const page: FC = () => {
  const session = getServerSession(authOptions);
  if (!session) notFound();

  return <div>page</div>;
};

export default page;
