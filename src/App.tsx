import { useInfiniteQuery } from "react-query";

interface CommentType {
  id: number;
  name: string;
  description: string;
}

function App() {
  const LIMIT = 10;

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
    </div>
  );
}

export default App;
