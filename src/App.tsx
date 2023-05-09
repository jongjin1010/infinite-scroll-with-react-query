import { useInfiniteQuery } from "react-query";
import { useCallback, useEffect, useRef } from "react";

interface CommentType {
  id: number;
  name: string;
  description: string;
}

function App() {
  const LIMIT = 10;
  const observerElem = useRef<HTMLDivElement>(null);

  /**
   * Github Api에서 'react' 관련 data 가져오기
   */

  const fetchRepositories = async (page: number) => {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=topic:react&per_page=${LIMIT}&page=${page}`
    );
    return response.json();
  };

  /**
   * useInfiniteQuery setup
   */

  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      "repos",
      ({ pageParam = 1 }) => fetchRepositories(pageParam),
      {
        getNextPageParam: (_, allPages) => {
          const nextPage = allPages.length + 1;
          return nextPage;
        },
      }
    );

  /**
   * scrollHeight - scrollTop과 clientHeight는 현재 보이는 뷰포트의 높이가 됨,
   * 이 둘을 비교하여 스크롤이 뷰포트 높이의 1.2배 이하로 내려왔을 때 데이터를 가져올 수 있는 조건을 듦
   */

  useEffect(() => {
    let fetching = false; // 현재 fetching 중 인지 구분하는 플래그

    const handleScroll = async () => {
      const { scrollHeight, scrollTop, clientHeight } =
        document.documentElement;

      if (!fetching && scrollHeight - scrollTop <= clientHeight * 1.2) {
        fetching = true;
        if (hasNextPage) await fetchNextPage();
        fetching = false;
      }
    };
    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage]);

  /**
   * IntersectionObserver를 활용하여 요소의 교차 여부를 감지하고,
   * 해당 요소가 보여질 때마다 fetchNextPage() 호출
   */

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  /**
   * IntersectionObserver를 생성하고 관찰 대상 요소와 콜백 함수를 설정하여 요소의 교차 여부를 감지함
   */

  useEffect(() => {
    const element = observerElem.current!;
    const option = { threshold: 0 };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);
    return () => observer.unobserve(element);
  }, [fetchNextPage, hasNextPage, handleObserver]);

  return (
    <div className="app">
      {isSuccess &&
        data?.pages?.map((page) =>
          page?.items?.map((comment: CommentType) => (
            <div className="result" key={comment.id}>
              <span>{comment.name}</span>
              <p>{comment.description}</p>
            </div>
          ))
        )}
      <div className="loader" ref={observerElem}>
        {isFetchingNextPage && hasNextPage ? "Loading..." : "No search left"}
      </div>
    </div>
  );
}

export default App;
