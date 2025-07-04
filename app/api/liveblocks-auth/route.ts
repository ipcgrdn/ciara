import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import ServerSupabase from "@/lib/server-supabase";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // URL 파라미터에서 room 정보 추출
    const { searchParams } = new URL(request.url);
    const room = searchParams.get("room");
    const userId = searchParams.get("userId");

    // 필수 정보 확인
    if (!room || !userId) {
      return NextResponse.json(
        { error: "room ID와 사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 문서 접근 권한 확인 (documents 테이블에서 소유자 확인)
    const hasAccess = await checkDocumentAccess(userId, room);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "문서에 접근할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // Liveblocks 세션 생성
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: "사용자", // 클라이언트에서 resolveUsers로 처리
        avatar: "",
        email: "",
      },
    });

    // 사용자에게 특정 room에 대한 전체 접근 권한 부여
    session.allow(room, session.FULL_ACCESS);

    // 인증된 세션 응답 반환
    const { status, body } = await session.authorize();

    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks 인증 오류:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 문서 접근 권한 확인 (단순한 소유자 확인)
 * @param userId - 사용자 ID
 * @param documentId - 문서 ID (room ID와 동일)
 * @returns 접근 권한 여부
 */
async function checkDocumentAccess(
  userId: string,
  documentId: string
): Promise<boolean> {
  try {
    // documents 테이블에서 해당 문서의 소유자 확인
    const { data, error } = await ServerSupabase.from("documents")
      .select("user_id")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (error) {
      // 문서가 존재하지 않는 경우도 접근 불가로 처리
      console.error("문서 권한 확인 오류:", error);
      return false;
    }

    // 문서가 존재하고 사용자가 소유자인 경우만 true
    return !!data;
  } catch (error) {
    console.error("문서 접근 권한 확인 중 오류:", error);
    return false;
  }
}
