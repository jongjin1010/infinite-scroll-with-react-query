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

  const fetchRepositories = async (page: number) => {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=topic:react&per_page=${LIMIT}&page=${page}`
    );
    return response.json();
  };

  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      "repos",
      ({ pageParam = 1 }) => fetchRepositories(pageParam),
      {
        getNextPageParam: (lastPage, allPages) => {
          const nextPage = allPages.length + 1;
          return nextPage;
        },
      }
    );

  useEffect(() => {
    let fetching = false;
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

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

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
