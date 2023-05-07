"use client";
import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UnseenChatToast from "./UnseenChatToast";

interface SidebarChatListProps {
  friends: User[];
  sessionId: string;
}

interface ExtendedMessage extends Message {
  senderImg: string;
  senderName: string;
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`));
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`));

    const chatHandler = (message: ExtendedMessage) => {
      const shouldNotify =
        pathname !==
        `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`;
      if (!shouldNotify) return;

      // Notify
      toast.custom((t) => (
        // Custom Component
        <UnseenChatToast
          t={t}
          senderId={message.senderId}
          sessionId={sessionId}
          senderImg={message.senderImg}
          senderName={message.senderName}
          senderMessage={message.text}
        />
      ));

      setUnseenMessages((prev) => [...prev, message]);
    };

    const newFriendHandler = () => {
      router.refresh();
    };

    pusherClient.bind("new-message", chatHandler);
    pusherClient.bind("new-friend", newFriendHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`));
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`));
      pusherClient.unbind("new-message", chatHandler);
      pusherClient.unbind("new-friend", newFriendHandler);
    };
  }, [pathname, sessionId, router]);

  useEffect(() => {
    if (pathname?.includes("chat")) {
      setUnseenMessages((prev) => {
        return prev.filter((msg) => !pathname.includes(msg.senderId));
      });
    }
  }, [pathname]);

  return (
    <ul role={"list"} className="max-h-[25rem] overflow-y-auto -mx-2 space-y-2">
      {friends.sort().map((friend) => {
        const unseenMessageCount = unseenMessages.filter((unseenMsg) => {
          return unseenMsg.senderId === friend.id;
        }).length;
        return (
          <li key={friend.id}>
            <a
              href={`/dashboard/chat/${chatHrefConstructor(
                sessionId,
                friend.id
              )}`}
              className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gat-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
            >
              {friend.name}
              {unseenMessageCount > 0 && (
                <div className="bg-indigo-600 font-medium text-xs text-white h-4 w-4 rounded-full flex justify-center items-center ml-4">
                  {unseenMessageCount}
                </div>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarChatList;
