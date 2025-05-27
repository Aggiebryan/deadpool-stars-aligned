
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const ScoreboardNavigation = () => {
  return (
    <div className="mt-8 text-center space-x-4">
      <Link to="/deceased">
        <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
          View Deaths
        </Button>
      </Link>
      <Link to="/rules">
        <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
          Game Rules
        </Button>
      </Link>
    </div>
  );
};
